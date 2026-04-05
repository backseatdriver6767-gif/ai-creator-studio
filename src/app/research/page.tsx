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

export default async function ResearchPage() {
  const runs = (await readJsonl<Run>("runs.jsonl")).slice(-20).reverse();
  const trades = (await readJsonl<Trip>("manual-trades.jsonl"));

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

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Cumulative P&amp;L (manual journal)</h2>
        <SparklinePnl series={equity} />
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
