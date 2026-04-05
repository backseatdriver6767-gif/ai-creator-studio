// Portfolio-level kill switch.
//
// This is the single most important piece of "trading" code in the whole
// harness, even though it never places an order. Every live trader who
// doesn't blow up has the discipline this module encodes; most who blow
// up had the discipline but skipped it once. The module's whole job is
// to refuse to authorize further trades when objective limits have been
// breached, independent of any strategy's opinion.
//
// Limits (all expressed as absolute values; all configurable):
//   dailyLossPct         — max intraday equity loss. Hit → flatten + halt.
//   maxDrawdownPct       — max peak-to-trough drawdown.
//   maxConsecutiveLosses — how many losses in a row before cooldown.
//   cooldownDays         — days to sit out after a consecutive-loss trip.
//   maxTradesPerDay      — prevents revenge-trading cascades.
//   maxPositionHeatPct   — total open-risk across positions.
//
// Input is a minimal snapshot — the module does not touch files or clocks
// by itself, so it is trivially testable.

/**
 * @typedef {Object} KillSwitchLimits
 * @property {number} [dailyLossPct=3]
 * @property {number} [maxDrawdownPct=15]
 * @property {number} [maxConsecutiveLosses=4]
 * @property {number} [cooldownDays=2]
 * @property {number} [maxTradesPerDay=10]
 * @property {number} [maxPositionHeatPct=6]
 */

/**
 * @typedef {Object} KillSwitchSnapshot
 * @property {number} sessionStartEquity
 * @property {number} currentEquity
 * @property {number} peakEquity
 * @property {number} consecutiveLosses
 * @property {number} tradesToday
 * @property {number} openHeatPct            Sum of (position risk / equity), as percent
 * @property {string|null} cooldownUntilISO  Set when the switch has tripped on losses
 * @property {string} todayISO
 */

export const DEFAULT_LIMITS = {
  dailyLossPct: 3,
  maxDrawdownPct: 15,
  maxConsecutiveLosses: 4,
  cooldownDays: 2,
  maxTradesPerDay: 10,
  maxPositionHeatPct: 6,
};

/**
 * Evaluate a snapshot against a set of limits. Returns:
 *   { ok, halted, reasons, cooldownUntilISO? }
 *
 * The semantics are deliberately asymmetric — the switch TRIPS on any
 * single breach, but can only be CLEARED by time (cooldown) or by the
 * operator explicitly resetting it. A strategy can never talk its way
 * out of a trip.
 */
export function evaluateKillSwitch(snapshot, limits = {}) {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const reasons = [];

  // If we're in an existing cooldown, nothing else matters.
  if (snapshot.cooldownUntilISO && snapshot.todayISO < snapshot.cooldownUntilISO) {
    return {
      ok: false,
      halted: true,
      reasons: [`cooldown in effect until ${snapshot.cooldownUntilISO}`],
      cooldownUntilISO: snapshot.cooldownUntilISO,
    };
  }

  // Daily loss
  if (snapshot.sessionStartEquity > 0) {
    const dayPnlPct = ((snapshot.currentEquity - snapshot.sessionStartEquity) / snapshot.sessionStartEquity) * 100;
    if (dayPnlPct <= -lim.dailyLossPct) {
      reasons.push(`daily loss ${dayPnlPct.toFixed(2)}% ≥ limit ${lim.dailyLossPct}%`);
    }
  }

  // Peak drawdown
  if (snapshot.peakEquity > 0) {
    const ddPct = ((snapshot.currentEquity - snapshot.peakEquity) / snapshot.peakEquity) * 100;
    if (ddPct <= -lim.maxDrawdownPct) {
      reasons.push(`drawdown ${ddPct.toFixed(2)}% ≥ limit ${lim.maxDrawdownPct}%`);
    }
  }

  // Consecutive losses
  if (snapshot.consecutiveLosses >= lim.maxConsecutiveLosses) {
    reasons.push(`${snapshot.consecutiveLosses} consecutive losses ≥ limit ${lim.maxConsecutiveLosses}`);
  }

  // Trade count
  if (snapshot.tradesToday >= lim.maxTradesPerDay) {
    reasons.push(`${snapshot.tradesToday} trades today ≥ limit ${lim.maxTradesPerDay}`);
  }

  // Portfolio heat
  if (snapshot.openHeatPct > lim.maxPositionHeatPct) {
    reasons.push(`open heat ${snapshot.openHeatPct.toFixed(2)}% > limit ${lim.maxPositionHeatPct}%`);
  }

  if (reasons.length === 0) {
    return { ok: true, halted: false, reasons: [] };
  }

  // Cooldown set only when the consecutive-loss trip fires (the others
  // are same-day events and reset tomorrow when the operator reviews).
  let cooldownUntilISO = null;
  if (snapshot.consecutiveLosses >= lim.maxConsecutiveLosses) {
    cooldownUntilISO = addBusinessDays(snapshot.todayISO, lim.cooldownDays);
  }

  return { ok: false, halted: true, reasons, cooldownUntilISO };
}

/**
 * Apply a trade result to an existing snapshot, returning a new
 * immutable snapshot. This is the canonical way to advance state —
 * never mutate a snapshot in place.
 */
export function applyTradeResult(snapshot, { pnl, risk, todayISO }) {
  const currentEquity = snapshot.currentEquity + pnl;
  const peakEquity = Math.max(snapshot.peakEquity, currentEquity);
  const consecutiveLosses = pnl < 0 ? snapshot.consecutiveLosses + 1 : 0;
  const sameDay = snapshot.todayISO === todayISO;
  const tradesToday = sameDay ? snapshot.tradesToday + 1 : 1;
  const sessionStartEquity = sameDay ? snapshot.sessionStartEquity : snapshot.currentEquity;
  const openHeatPct = snapshot.currentEquity > 0 ? (risk / snapshot.currentEquity) * 100 : 0;
  return {
    ...snapshot,
    sessionStartEquity,
    currentEquity,
    peakEquity,
    consecutiveLosses,
    tradesToday,
    openHeatPct,
    todayISO,
  };
}

function addBusinessDays(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}
