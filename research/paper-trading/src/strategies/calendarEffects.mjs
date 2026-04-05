// Calendar-effect strategies. These are NOT expected to have a robust edge;
// they are useful as pedagogical baselines — tests you run that SHOULD fail
// significance tests to calibrate your intuition for noise.
//
// Provided: turn-of-month (long last 3 + first 3 trading days), FOMC drift
// (long on FOMC day, flat otherwise), Friday-only long.

import { isEventDay } from "../intel/econCalendar.mjs";

export function turnOfMonth({ before = 3, after = 3 } = {}) {
  return {
    name: `TurnOfMonth(${before}+${after})`,
    onBar(bar) {
      const d = new Date(bar.date);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const dom = d.getDate();
      if (dom >= lastDay - before + 1 || dom <= after) return "LONG";
      return "FLAT";
    },
  };
}

export function fomcDrift() {
  return {
    name: "FOMCDrift",
    onBar(bar) {
      return isEventDay(bar.date.slice(0, 10), { kinds: ["FOMC"] }) ? "LONG" : "FLAT";
    },
  };
}

export function fridayOnly() {
  return {
    name: "FridayOnly",
    onBar(bar) {
      const dow = new Date(bar.date).getDay();
      return dow === 5 ? "LONG" : "FLAT";
    },
  };
}
