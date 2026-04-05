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

export default async function ResearchPage() {
  const runs = (await readJsonl<Run>("runs.jsonl")).slice(-20).reverse();
  const trades = (await readJsonl<Trip>("manual-trades.jsonl"));

  const totalPnl = trades
    .filter((t) => "pnl" in t)
    .reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 24, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Paper-trading research dashboard</h1>
      <p style={{ color: "#888", marginTop: 0, marginBottom: 32 }}>
        Read-only. No trade entry. Paper/simulation only.
      </p>

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
