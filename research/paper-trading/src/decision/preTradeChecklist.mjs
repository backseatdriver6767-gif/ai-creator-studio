// Pre-trade checklist. Runs a set of hard rules against a plan + current
// portfolio state + calendar + personal edge data. Returns GO or NO-GO with
// the specific reason(s). Refuses to return GO if any critical check fails.

import { isEventDay, nextEvent } from "../intel/econCalendar.mjs";
import { validatePlan } from "./tradePlan.mjs";
import { portfolioHeat } from "../risk/portfolioHeat.mjs";

/**
 * @param {{plan, equity, openPositions, today, recentEdge}} ctx
 * @param {object} rules
 */
export function preTradeChecklist(ctx, rules = {}) {
  const {
    maxHeatPct = 0.06,
    requireEdgeSample = 20,
    minSetupExpectancy = 0,
    blockOnFOMC = true,
    maxTradesPerDay = 5,
    minRewardRisk = 1.5,
  } = rules;

  const checks = [];
  const fail = (name, msg) => checks.push({ name, ok: false, msg });
  const pass = (name, msg = "") => checks.push({ name, ok: true, msg });

  // 1. Plan validity
  const v = validatePlan(ctx.plan);
  if (!v.ok) fail("plan validity", v.errors.join("; "));
  else pass("plan validity", `R:R ${v.rewardRisk}`);

  // 2. Reward/risk minimum
  if (v.rewardRisk < minRewardRisk) fail("reward/risk", `R:R ${v.rewardRisk} < ${minRewardRisk}`);
  else pass("reward/risk");

  // 3. Event day block
  const today = ctx.today || new Date().toISOString().slice(0, 10);
  if (blockOnFOMC && isEventDay(today, { kinds: ["FOMC"] })) fail("event day", "FOMC today — no new positions");
  else pass("event day");

  // 4. Portfolio heat AFTER including this trade
  const heat = portfolioHeat({
    equity: ctx.equity,
    positions: [...(ctx.openPositions || []), {
      symbol: ctx.plan.symbol, shares: ctx.plan.qty, entry: ctx.plan.entry, stop: ctx.plan.stop,
    }],
    cap: maxHeatPct,
  });
  if (heat.overCap) fail("portfolio heat", `would be ${heat.totalRiskPct}% (cap ${maxHeatPct * 100}%)`);
  else pass("portfolio heat", `${heat.totalRiskPct}%`);

  // 5. Max trades today
  const todayPlans = (ctx.todayPlans || 0) + 1;
  if (todayPlans > maxTradesPerDay) fail("trade count", `would be ${todayPlans} today (max ${maxTradesPerDay})`);
  else pass("trade count");

  // 6. Edge in this setup (from personal journal)
  if (ctx.recentEdge) {
    const bySetup = ctx.recentEdge.bySetup || {};
    const entry = bySetup[ctx.plan.setup];
    if (!entry || entry.n < requireEdgeSample) {
      fail("setup edge", `only ${entry?.n ?? 0} trades in setup "${ctx.plan.setup}" (need ${requireEdgeSample})`);
    } else if (entry.expectancy <= minSetupExpectancy) {
      fail("setup edge", `setup "${ctx.plan.setup}" expectancy ${entry.expectancy} <= ${minSetupExpectancy}`);
    } else {
      pass("setup edge", `expectancy ${entry.expectancy} over ${entry.n} trades`);
    }
  } else {
    checks.push({ name: "setup edge", ok: null, msg: "no edge data supplied — warning only" });
  }

  const criticalFails = checks.filter((c) => c.ok === false);
  return {
    decision: criticalFails.length === 0 ? "GO" : "NO-GO",
    checks,
    fails: criticalFails.map((c) => `${c.name}: ${c.msg}`),
    nextEvent: nextEvent(today),
  };
}
