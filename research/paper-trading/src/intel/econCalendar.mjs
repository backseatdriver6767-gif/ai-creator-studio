// Economic calendar: we don't have a free stable event API, but the critical
// dates (FOMC, CPI, NFP) are scheduled a year+ in advance and rarely change.
// Ship them as a static table. Update annually.
//
// Strategies can use `isEventDay(date)` to auto-flatten before known events.

export const EVENTS_2024_2026 = [
  // FOMC rate decisions
  { date: "2024-01-31", kind: "FOMC" }, { date: "2024-03-20", kind: "FOMC" },
  { date: "2024-05-01", kind: "FOMC" }, { date: "2024-06-12", kind: "FOMC" },
  { date: "2024-07-31", kind: "FOMC" }, { date: "2024-09-18", kind: "FOMC" },
  { date: "2024-11-07", kind: "FOMC" }, { date: "2024-12-18", kind: "FOMC" },
  { date: "2025-01-29", kind: "FOMC" }, { date: "2025-03-19", kind: "FOMC" },
  { date: "2025-05-07", kind: "FOMC" }, { date: "2025-06-18", kind: "FOMC" },
  { date: "2025-07-30", kind: "FOMC" }, { date: "2025-09-17", kind: "FOMC" },
  { date: "2025-10-29", kind: "FOMC" }, { date: "2025-12-10", kind: "FOMC" },
  { date: "2026-01-28", kind: "FOMC" }, { date: "2026-03-18", kind: "FOMC" },
  { date: "2026-04-29", kind: "FOMC" }, { date: "2026-06-17", kind: "FOMC" },
];

export function isEventDay(isoDate, { kinds = null } = {}) {
  return EVENTS_2024_2026.some(
    (e) => e.date === isoDate && (!kinds || kinds.includes(e.kind)),
  );
}

export function nextEvent(isoDate) {
  return EVENTS_2024_2026.find((e) => e.date >= isoDate) || null;
}

export function eventsInRange(fromISO, toISO) {
  return EVENTS_2024_2026.filter((e) => e.date >= fromISO && e.date <= toISO);
}
