# The Method

The material in this program is not special. Algebra is algebra; it is in ten
thousand textbooks. What determines whether you reach calculus in a year is
**how you practice**, and most people practice in a way that feels productive and
isn't.

This document is the operating system. Read it once carefully, then refer back.

---

## 1. The central principle: retrieval, not review

The single most robust finding in the study of learning is the **testing effect**:
attempting to retrieve information from memory strengthens it far more than
re-exposure does. Re-reading a worked solution, watching a lecture again, and
highlighting notes all produce a strong feeling of fluency and very little durable
learning. Struggling to produce an answer — even failing to produce it — produces
less feeling of fluency and much more learning.

This has a hard practical consequence:

> **You never read a solution before attempting the problem.** Not once. Not for
> the "hard ones." Attempt it, get stuck, sit in the stuck for a genuine 3–5
> minutes, *then* read.

The discomfort is the mechanism, not a side effect. Practice that feels smooth is
usually practice that isn't working. This is why the program will sometimes feel
harder than it seems it should — that is by design, and it is the reason it is
fast.

---

## 2. Interleaving: mixed sets, not blocked drill

Standard textbooks group problems by type: thirty factoring problems, then thirty
quadratic-formula problems. This is **blocked practice**. It feels great — you get
into a rhythm and accuracy climbs — and it transfers poorly, because you never
practice the hardest real skill, which is *deciding which technique applies*.

Every practice set in this program is **interleaved**: problem types are shuffled
so that each problem begins with the question "what kind of thing is this?" Your
accuracy during practice will be lower than it would be with blocked drill. Your
performance on exams and on later material will be substantially higher.

When you build your own extra practice, shuffle it. Always.

---

## 3. Spaced repetition for the reflex layer

Some things must be *known*, instantly, without derivation:

- exponent and radical laws
- factoring patterns (difference of squares, sum/difference of cubes, trinomials)
- the unit circle, in full
- the fundamental trig identities
- derivative and integral rules, once we reach them

These go in a spaced-repetition deck (`reference/automaticity-deck.md` lists the
full set). Use Anki or any SRS tool. Rules:

- **10 minutes daily, every day, including rest days.** Non-negotiable and small
  enough that there is no excuse.
- Cards are *procedures and facts*, not concepts. "What is `sin(7π/6)`?" is a card.
  "Why does the unit circle work?" is not — that belongs in a lesson.
- A card you can't answer in **under 3 seconds** counts as failed. Speed is the
  entire point; a fact you must reconstruct is not yet free.

This 10 minutes/day is what makes the "training wheels off" goal achievable. It
runs in parallel with everything else and quietly converts effortful knowledge
into free knowledge.

---

## 4. Worked example → faded → independent

For any genuinely new technique, learning is fastest in three stages:

1. **Study a fully worked example.** Read it line by line and, at each line, ask
   "why this step?" before reading on.
2. **Complete a faded example.** A partially worked problem with steps removed —
   you supply the missing ones. This is the highest-value stage and the one
   everyone skips.
3. **Solve independently.**

Skipping stage 1 for genuinely new material wastes time — pure discovery learning
is inefficient for procedural skills. But *staying* in stage 1 too long is the
more common failure, and it produces the illusion of competence. Move to stage 3
as soon as stage 2 is comfortable. Each unit's practice set is built in this order.

---

## 5. The error log

**This is the highest-leverage habit in the program.** Every missed problem gets
one line in the log, and every miss gets classified into exactly one category:

| Code | Category | Meaning |
|---|---|---|
| `C` | Concept | You did not know or understand the method. |
| `A` | Algebra | You knew the method; the algebra broke. |
| `R` | Arithmetic | Sign error, times-table slip, dropped digit. |
| `M` | Misread | You solved a different problem than the one asked. |
| `S` | Stopped short | Correct work, but you didn't finish or simplify. |

Classification is the point. The distribution tells you what to fix, and the
categories demand completely different responses:

- Mostly `C` → you are moving too fast. Slow down, add worked examples.
- Mostly `A` → **the most common pattern for returning students, and the one that
  ended Calculus II.** Do not push forward. Go back and drill the specific algebra
  skill until it is automatic. This is exactly the failure mode this program
  exists to prevent.
- Mostly `R` → a process problem, not a knowledge problem. Slow your hand, write
  bigger, show every step, stop skipping lines mentally.
- Mostly `M` → read the problem twice and state what is being asked in your own
  words before starting.
- Mostly `S` → build a finishing checklist and run it on every problem.

Review the log every Sunday. Any skill appearing three times becomes a drill for
the coming week. A skill that stops appearing is genuinely fixed.

---

## 6. Session structure

**The standard 75-minute session:**

| Minutes | Activity |
|---|---|
| 0–10 | SRS deck (the daily 10 minutes) |
| 10–20 | Warm-up: 5 mixed problems from *previous* units, timed |
| 20–50 | New material: read lesson, work examples, faded practice |
| 50–70 | Independent practice set, interleaved |
| 70–75 | Log errors, classify, note tomorrow's starting point |

**Weekly cadence (the 6–8 hr/week baseline track):**

- 4 sessions of 75 minutes
- 1 session of 60 minutes: pure mixed review, no new material
- Sunday: 20 minutes reviewing the error log and setting next week's drills

The mixed-review session is not optional and is the first thing people cut. It is
where retention actually gets built. Cut a new-material session before you cut it.

---

## 7. Mastery gates

You do not advance on a schedule. You advance on a **gate exam**, taken at the end
of each phase under real conditions: timed, no notes, no calculator except where
explicitly permitted.

**The gate is 85%.** Not 70%. Not "good enough to move on."

This threshold is the most important number in the document, and it is high on
purpose. Prerequisite knowledge compounds: a topic held at 70% becomes 50% under
the load of the next course, and the accumulated debt is precisely what makes
Calculus II feel impossible. An 85% gate is what lets you take the training wheels
off later, because it means the foundation genuinely holds weight.

Below 85%: you do not repeat the whole phase. You repair only the sections you
missed, then retake. Usually 3–7 days.

---

## 8. Rules of engagement

1. **Handwrite everything.** Full stop. There is good reason to think the motor
   act of writing mathematics supports retention and error-catching in a way
   typing does not, and typed math is slow enough to disrupt your thinking.
2. **No calculator in Phases 1–3** except where a problem explicitly calls for a
   decimal. You are rebuilding number sense; the calculator prevents it.
3. **Show every line.** Skipped steps are where sign errors live. When you are
   fluent you may compress — not before, and the program will tell you when.
4. **Stuck for 10 minutes means stop.** Read the solution, understand it, then
   *redo the problem from a blank page* later that day. Grinding past 10 minutes
   has poor returns; the blank-page redo is what converts it into learning.
5. **Consistency beats intensity.** Five 75-minute sessions beat one 6-hour
   Saturday, by a wide margin — spacing is doing real work here.
6. **Never study a topic you have already mastered because it feels good.** That
   is entertainment. Go where the error log points.

---

## 9. If you fall behind

You will. Everyone does. The protocol:

- **Missed under a week:** resume where you stopped. Add one extra mixed-review
  session.
- **Missed 1–4 weeks:** do not restart the phase. Take the most recent gate exam
  cold as a diagnostic, repair what it exposes, continue.
- **Missed over a month:** retake the placement diagnostic. Re-place honestly. The
  savings effect still applies — recovery is much faster than the first pass, and
  the second pass through a phase typically takes 40–60% of the original time.

Falling behind is a scheduling event, not a verdict. The only genuinely fatal move
is advancing past a gate you did not pass.
