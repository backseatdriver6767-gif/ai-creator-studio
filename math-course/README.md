# Math Rebuild: Zero to Calculus II

A structured, self-paced program to rebuild mathematical fluency from arithmetic
through Calculus II, designed for an adult returning to math after a long gap.

**Student profile this was built for:** strong performer (A-range) through
precalculus, lost footing in Calculus I, withdrew from Calculus II, ~15 years
removed from any rigorous math course. Goal: genuine calculus-level competence
within 12-18 months.

---

## The core diagnosis

Most people who stall out in Calculus I/II did not fail at calculus. They failed
at **automaticity** — the algebra and trigonometry underneath calculus was never
made reflexive, only understood.

This matters because of how working memory behaves. Solving an integration-by-parts
problem requires holding the strategy, the substitution, and the bookkeeping in
mind simultaneously. If simplifying `(1/x - 1/3)/(x - 3)` costs you conscious
effort, there is no capacity left for the calculus. The symptom is "I can't keep
up." The cause is that the substrate isn't free.

Calculus II is the course that exposes this most brutally, because it is
essentially a technique course: trig substitution, partial fractions, and series
tests are each ~80% algebraic manipulation performed quickly and cleanly, with a
thin layer of calculus reasoning on top.

**Therefore:** this program spends its early weeks aggressively rebuilding the
reflex layer, then moves fast through conceptual material that was previously
understood. Relearning is far faster than first learning — the savings effect is
real and large. We exploit it.

---

## Program structure

| Phase | Focus | Weeks | Gate |
|---|---|---|---|
| 0 | Placement diagnostic | 0 | — |
| 1 | The Algebra Engine (reflex layer) | 1–6 | Gate Exam A |
| 2 | Functions & applied geometry | 7–12 | Gate Exam B |
| 3 | Trigonometry to automaticity | 13–20 | Gate Exam C |
| 4 | Precalculus glue | 21–28 | Gate Exam D |
| 5 | Calculus I | 29–42 | Gate Exam E |
| 6 | Calculus II | 43–56 | Final |

~56 weeks at 6–8 hours/week. See `CURRICULUM.md` for the week-by-week map,
including the compressed 40-week track if you can commit 10–12 hours/week.

---

## What is deliberately cut

Rushing responsibly means cutting real things. These are cut on purpose:

- **Two-column Euclidean proof geometry.** Formal synthetic proof is excellent
  training in logic, but it is not load-bearing for calculus. We keep only the
  geometry calculus actually consumes: similar triangles, Pythagoras,
  area/volume/surface-area formulas, coordinate geometry, and the circle/triangle
  facts that generate trigonometry. This alone saves ~6 weeks.
- **Conic sections in depth.** Reduced to recognition and standard forms. The
  full treatment (directrices, eccentricity, rotation of axes) is not needed until
  much later, if ever.
- **Matrix algebra and determinants beyond 2x2 systems.** This is linear algebra's
  job, not calculus's prerequisite.
- **Statistics and probability.** Genuinely important, entirely orthogonal to this
  goal. A separate project.
- **Hand-computation of anything a calculator does better,** except where the
  computation itself builds the pattern recognition we need (factoring, unit
  circle, derivative rules).

What is emphatically **not** cut: fraction arithmetic, exponent laws, factoring,
rational expressions, the unit circle, and trig identities. These are the load
paths. Everything else stands on them.

---

## How to use this repository

1. **Take the placement exam first.** `diagnostics/placement-exam.md`. No
   calculator, no notes, no time limit. Score it against
   `diagnostics/placement-exam-key.md`. Do not skip this and do not study for it —
   its only purpose is to tell us where to start, and a flattering score costs you
   months.
2. **Read `METHOD.md`.** It describes the session structure, the error log, and
   the spaced-repetition system. The method matters more than the material; the
   material is freely available everywhere, the method is why this works.
3. **Start at the phase the diagnostic places you in.** Phase 1 begins at
   `phase-1-algebra-engine/unit-01-signed-numbers-and-fractions.md`.
4. **Maintain the error log from day one.** `reference/error-log-template.md`.
   This is not optional busywork — it is the single highest-leverage habit in the
   program.

---

## Contents

```
math-course/
├── README.md                         this file
├── METHOD.md                         the learning system
├── CURRICULUM.md                     week-by-week map, all 6 phases
├── diagnostics/
│   ├── placement-exam.md             40 questions, 8 sections
│   └── placement-exam-key.md         answers, scoring, placement rules
├── reference/
│   ├── automaticity-deck.md          the facts that must become reflex
│   └── error-log-template.md         error classification system
└── phase-1-algebra-engine/
    ├── unit-01-signed-numbers-and-fractions.md
    ├── unit-01-practice.md
    └── unit-01-practice-key.md       fully worked solutions
```
