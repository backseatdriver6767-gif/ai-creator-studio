# Unit 01 — Practice Key (Worked Solutions)

Log every miss with its category code **before** reading the solution.

---

## Set A — Faded examples

**A1.** `-8`
```
5 - 8 = -3
7 - 3[2 - (-3)]
2 - (-3) = 2 + 3 = 5
7 - 3[5] = 7 - 15 = -8
```

**A2.** `1/8`
```
LCD of 8, 2, 4 = 8
3/8 = 3/8    1/2 = 4/8    1/4 = 2/8
3/8 - 4/8 + 2/8 = 1/8
```

**A3.** `-1/(2(x + 2))`
```
Common denominator: 2(x + 2)
1/(x+2) = 2/(2(x+2))        1/2 = (x+2)/(2(x+2))
Numerator = (2 - (x+2)) / (2(x+2)) = -x / (2(x+2))
Divide by x:  -x / (2x(x+2))
Cancel x:     -1 / (2(x+2))
```
Watch the numerator: `2 - (x + 2) = 2 - x - 2 = -x`. Distributing the minus sign
across *both* terms is where this problem is usually lost.

**A4.** `1/4`
```
(5/6) · (3/10)
5 and 10 share 5;  6 and 3 share 3
= (1/2) · (1/2) = 1/4
```

---

## Set B — Independent practice

| # | Answer | Note |
|---|---|---|
| B1 | `-5` | `-8 + 3` |
| B2 | `3/4` | Cancel first: `2/8 → 1/4`, `15/5 → 3` |
| B3 | `-9` | `-(3²)`, not `(-3)²` |
| B4 | `-8` | Same as A1 — deliberate repeat |
| B5 | `2/3` | `3/6 + 2/6 - 1/6 = 4/6` |
| B6 | `-64` | Odd exponent keeps the sign |
| B7 | `1/4` | Same as A4 — deliberate repeat |
| B8 | `13` | `-2 + 15`; multiply before subtracting |
| B9 | `1/3` | `6/36 = 1/6`, then `1/6 + 1/6 = 2/6` |
| B10 | `1` | Even exponent |
| B11 | `-28` | See below |
| B12 | `1/6` | `(2/3)(1/4) = 2/12` |
| B13 | `-5` | See below |
| B14 | `10/3` | `(5/6) ÷ (1/4) = (5/6)(4)` |
| B15 | `9` | Left to right — divide first |
| B16 | `0` | `-25 + 25` |
| B17 | `-1/6` | `(-1/8)(4/3) = -4/24` |
| B18 | `0` | `7 - 7` |
| B19 | `9/4` | Negative exponent inverts the fraction |
| B20 | `-3` | `-3 + 3 - 3` |

**B11 worked.**
```
4 - 2(3 - 7)^2
Parentheses:  3 - 7 = -4
Exponent:     (-4)^2 = 16        ← the negative IS inside, so it squares away
Multiply:     2 · 16 = 32
Subtract:     4 - 32 = -28
```
The frequent error is `4 - 2(-4)^2 = 4 + 32 = 36`, from attaching the minus sign
to the 2 before the exponent is applied. The `2` is subtracted, not negative.

**B13 worked.**
```
-(-(-5))
Innermost:  -5
Next:       -(-5) = 5
Outermost:  -(5) = -5
```
Three negations. An odd number of negations leaves it negative.

**B19 worked.**
```
(2/3)^(-2) = (3/2)^2 = 9/4
```
A negative exponent on a fraction flips the fraction, then applies the positive
exponent. It does **not** make the result negative — a persistent confusion worth
a trap card in your deck.

---

## Set C — Calculus preview

**C1.** `-1 / (x(x + h))`
```
[1/(x+h) - 1/x] / h

Numerator over common denominator x(x+h):
    = [x - (x+h)] / (x(x+h))
    = [x - x - h] / (x(x+h))
    = -h / (x(x+h))

Divide by h  (multiply by 1/h):
    = -h / (x(x+h)·h)

Cancel h:
    = -1 / (x(x+h))
```

**C2.** `-1 / (4(4 + h))`
```
f(3+h) = 1/(4+h)        f(3) = 1/4

[1/(4+h) - 1/4] / h
Numerator over 4(4+h):
    = [4 - (4+h)] / (4(4+h)) = -h / (4(4+h))
Divide by h and cancel:
    = -1 / (4(4+h))
```

**C3.** `-1 / (2(x + 2))` — identical to A3.

**C4.** `-2 / (x(x + h))`
```
[2/(x+h) - 2/x] / h
Numerator over x(x+h):
    = [2x - 2(x+h)] / (x(x+h))
    = [2x - 2x - 2h] / (x(x+h))
    = -2h / (x(x+h))
Divide by h and cancel:
    = -2 / (x(x+h))
```

---

## What Set C was actually doing

Look at C1. You simplified `[f(x+h) - f(x)]/h` for `f(x) = 1/x` and got

```
-1 / (x(x + h))
```

In Week 29 you will take the limit of that expression as `h → 0`. Setting `h = 0`
gives `-1/(x · x) = -1/x²`, which is the derivative of `1/x`.

That is the entire content of the derivative of `1/x` from first principles — and
you just did all of it except the final substitution, in Week 1, using nothing but
fraction arithmetic.

This is the argument for Phase 1 in a single example. The calculus in that problem
is one step. The other six steps are Unit 01. When people say Calculus I is hard,
what is usually happening is that those six steps are not free, and the one
genuinely new idea gets no attention because all the effort went into the
algebra.

Make the six steps free now, and Week 29 will consist of learning one new idea.

---

## Scoring this set

Count misses across Sets B and C (24 problems):

| Misses | Verdict |
|---|---|
| 0–2 | Move to Unit 02. Keep Unit 01 in the SRS deck. |
| 3–5 | Redo Set B in two days. Then Unit 02. |
| 6–9 | Re-read the lesson's trap table. Redo both sets. Add two days. |
| 10+ | Repeat the unit. This is not a setback — it is the material working. |

Now classify each miss by code (`C` / `A` / `R` / `M` / `S`) in your error log. In
this unit specifically, expect mostly `R` (arithmetic) and `A` (algebra). Heavy
`R` here is normal after fifteen years and resolves quickly with repetition — it
is a hand-and-habit problem, not a knowledge problem, and it is the reason the
"show every line" rule exists.
