// Trade plan schema + storage. A "plan" is a pending intention to trade,
// validated against rules BEFORE execution. You log the plan first, then
// either follow it or don't. The plan-adherence rate becomes a leading
// indicator of your behavioral edge.

import { mkdir, appendFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../journal/plans.jsonl");

/** Validate a plan against minimum hygiene rules. Returns { ok, errors }. */
export function validatePlan(plan) {
  const errors = [];
  if (!plan.symbol) errors.push("symbol required");
  if (!plan.side || !["BUY", "SHORT"].includes(plan.side)) errors.push("side must be BUY or SHORT");
  if (!(plan.qty > 0)) errors.push("qty > 0 required");
  if (!(plan.entry > 0)) errors.push("entry > 0 required");
  if (!(plan.stop > 0)) errors.push("stop > 0 required");
  if (!(plan.target > 0)) errors.push("target > 0 required");
  if (!plan.setup) errors.push("setup required (name the pattern)");
  if (plan.side === "BUY" && plan.stop >= plan.entry) errors.push("BUY stop must be below entry");
  if (plan.side === "BUY" && plan.target <= plan.entry) errors.push("BUY target must be above entry");
  if (plan.side === "SHORT" && plan.stop <= plan.entry) errors.push("SHORT stop must be above entry");
  if (plan.side === "SHORT" && plan.target >= plan.entry) errors.push("SHORT target must be below entry");
  const riskPerShare = Math.abs(plan.entry - plan.stop);
  const reward = Math.abs(plan.target - plan.entry);
  const rr = riskPerShare > 0 ? reward / riskPerShare : 0;
  if (rr < 1) errors.push(`reward/risk ${rr.toFixed(2)} < 1.0 (wouldn't accept)`);
  return { ok: errors.length === 0, errors, rewardRisk: Number(rr.toFixed(2)) };
}

export async function logPlan(plan) {
  const v = validatePlan(plan);
  await mkdir(path.dirname(FILE), { recursive: true });
  const record = {
    planId: plan.planId || randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    validation: v,
    ...plan,
  };
  await appendFile(FILE, JSON.stringify(record) + "\n");
  return record;
}

export async function readAllPlans() {
  if (!existsSync(FILE)) return [];
  const raw = await readFile(FILE, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

/** Mark a plan as followed or skipped. Rewrites the file (append + rewrite). */
export async function markPlan(planId, { followed, notes = "", actualEntry = null, actualExit = null }) {
  const all = await readAllPlans();
  const idx = all.findIndex((p) => p.planId === planId);
  if (idx < 0) throw new Error(`plan ${planId} not found`);
  all[idx] = { ...all[idx], status: followed ? "followed" : "skipped", followedAt: new Date().toISOString(), notes, actualEntry, actualExit };
  await writeFile(FILE, all.map((p) => JSON.stringify(p)).join("\n") + "\n");
  return all[idx];
}

export async function adherenceStats() {
  const all = await readAllPlans();
  const resolved = all.filter((p) => p.status !== "pending");
  if (!resolved.length) return { plans: 0 };
  const followed = resolved.filter((p) => p.status === "followed").length;
  return {
    plans: resolved.length,
    followed,
    skipped: resolved.length - followed,
    adherencePct: Number(((followed / resolved.length) * 100).toFixed(1)),
  };
}
