// Corporate actions log. We deliberately do NOT fetch splits/dividends from
// a vendor here; any attempt at free scraped data is a landmine. Instead we
// (a) detect suspected unadjusted splits in a series, and (b) allow the user
// to record known corporate actions alongside their journal for audit.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../journal/corp-actions.json");

export function detectSuspectedSplits(bars, { jumpThreshold = 0.25 } = {}) {
  const suspects = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].close;
    const cur = bars[i].open;
    if (prev > 0) {
      const r = cur / prev - 1;
      if (Math.abs(r) > jumpThreshold) {
        // Closest common split ratios
        const ratios = [2, 3, 4, 5, 7, 10, 0.5, 1 / 3, 0.25, 0.2, 0.1];
        const guess = ratios
          .map((k) => ({ k, diff: Math.abs(cur / prev - 1 / k) }))
          .sort((a, b) => a.diff - b.diff)[0];
        suspects.push({
          date: bars[i].date,
          prevClose: prev,
          open: cur,
          changePct: Number((r * 100).toFixed(2)),
          suspectedSplitRatio: guess.k,
        });
      }
    }
  }
  return suspects;
}

export async function recordCorporateAction({ symbol, type, date, ratio = null, amount = null, notes = "" }) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const existing = existsSync(FILE) ? JSON.parse(await readFile(FILE, "utf8")) : [];
  existing.push({ symbol, type, date, ratio, amount, notes, recordedAt: new Date().toISOString() });
  await writeFile(FILE, JSON.stringify(existing, null, 2));
  return existing.length;
}

export async function readCorporateActions(symbol = null) {
  if (!existsSync(FILE)) return [];
  const all = JSON.parse(await readFile(FILE, "utf8"));
  return symbol ? all.filter((a) => a.symbol === symbol) : all;
}
