# Unit 01 — Signed Numbers, Order of Operations & Fractions

**Phase 1, Week 1 · Target: 5 sessions**

---

## Why this unit exists

This looks like the most elementary material in the program, and it is the most
load-bearing. Here is where it actually shows up:

- **The quotient rule** produces a fraction whose numerator is a difference of
  products. Every derivative of a rational function ends in fraction arithmetic.
- **The difference quotient** — the definition of the derivative — requires
  combining `1/(x+h) - 1/x` and simplifying a complex fraction. This is Week 29
  material and it is *entirely* Unit 01 skills.
- **Partial fraction decomposition**, the technique in Week 46, is fraction
  arithmetic run backwards.
- **Sign errors** are the number one cause of wrong answers in calculus, by a
  wide margin, and they originate here.

If you scored 5/5 on Section 1 of the diagnostic, compress this unit: skip to the
practice sets, do them timed, and move on. If you scored 3 or below, this week is
the most valuable week in Phase 1.

---

## 1. Signed numbers

### Subtracting a negative

`a - (-b) = a + b`. Two adjacent minus signs make a plus.

The reliable mental model: think of `-` as "the opposite of." `-(-5)` is "the
opposite of negative five," which is `5`.

```
-3 - (-7) + (-2)
= -3 + 7 - 2
= 2
```

Rewriting every subtraction as addition of a negative *before* computing removes
most sign errors:

```
5 - 8 - (-3)  →  5 + (-8) + 3  =  0
```

This looks like an unnecessary extra line. Write it anyway. Compressed steps are
where signs die.

### Exponents and negatives — the critical distinction

```
(-2)^4 = (-2)(-2)(-2)(-2) = 16      the negative is INSIDE, it gets raised
-2^4   = -(2^4) = -(16) = -16       the negative is OUTSIDE, applied after
```

Exponentiation binds tighter than negation. `-2^4` means "negate the result of
`2^4`," not "raise `-2` to the fourth."

This single distinction was Question 4 on your diagnostic, and it reappears in
every second-derivative computation you will ever do.

```
-3^2 = -9        (-3)^2 = 9
-5^2 = -25       (-5)^2 = 25
```

**Rule:** a negative base is raised to a power *only* when parentheses put it
there.

### Sign of a power

- Negative base, **even** exponent → positive. `(-2)^4 = 16`
- Negative base, **odd** exponent → negative. `(-2)^3 = -8`

---

## 2. Order of operations

**PEMDAS**, with the two qualifications that actually matter:

1. **P**arentheses (innermost first)
2. **E**xponents
3. **M**ultiplication and **D**ivision — *left to right, equal priority*
4. **A**ddition and **S**ubtraction — *left to right, equal priority*

The two failure points:

**Multiplication does not outrank division.**
```
6 ÷ 2 · 3
= 3 · 3        left to right: divide first because it comes first
= 9            NOT 6 ÷ 6 = 1
```

**Subtraction does not outrank addition.**
```
10 - 4 + 3
= 6 + 3
= 9            NOT 10 - 7 = 3
```

### Worked example

```
5 - 2[3 - (4 - 7)]

Innermost parentheses:     4 - 7 = -3
                           5 - 2[3 - (-3)]
Inside the brackets:       3 - (-3) = 3 + 3 = 6
                           5 - 2[6]
Multiplication:            2 · 6 = 12
                           5 - 12
Subtraction:               = -7
```

Note that the brackets are fully resolved before the `2` is distributed. A common
error is multiplying `2` into `3` early, giving `5 - 6 - (-3)`, which is wrong —
the bracket is a single quantity until it is evaluated.

---

## 3. Fraction arithmetic

### Multiplication — the easy one

Multiply across. Cancel common factors *before* multiplying to keep numbers small.

```
(3/4) · (8/9)

Cancel: 3 and 9 share 3;  4 and 8 share 4
= (1/1) · (2/3)
= 2/3
```

Canceling first is not just tidiness — it avoids `24/36` and the extra reduction
step where errors enter.

### Division — invert and multiply

```
(3/4) ÷ (9/8) = (3/4) · (8/9) = 2/3
```

The second fraction flips. Only the second.

### Addition and subtraction — requires a common denominator

```
2/3 - 5/6 + 1/4

LCD of 3, 6, 4 is 12.
2/3 = 8/12      5/6 = 10/12      1/4 = 3/12

= 8/12 - 10/12 + 3/12
= 1/12
```

Find the LCD by taking the highest power of each prime appearing in any
denominator. For 3, 6, 4: primes are 2 and 3; highest power of 2 is `2² = 4` (from
the 4), highest power of 3 is `3` (from 3 and 6). LCD `= 4 · 3 = 12`.

You may use any common denominator — `3 · 6 · 4 = 72` works — but you will then
reduce at the end, with more chances to slip.

---

## 4. Complex fractions

A fraction containing fractions. **This is the most important section in the
unit** — complex fractions are the entire mechanical content of the difference
quotient.

**Method:** simplify the numerator into a single fraction, simplify the
denominator into a single fraction, then divide (invert and multiply).

### Worked example — the diagnostic's Question 23

```
(1/x - 1/3) / (x - 3)

Numerator, over the common denominator 3x:
    1/x - 1/3 = 3/(3x) - x/(3x) = (3 - x)/(3x)

Now divide by (x - 3), i.e. multiply by 1/(x - 3):
    = (3 - x) / (3x(x - 3))

Recognize that (3 - x) = -(x - 3):
    = -(x - 3) / (3x(x - 3))

Cancel (x - 3):
    = -1/(3x)
```

The move to internalize is the second-to-last line. **`(3 - x)` and `(x - 3)` differ
by exactly a factor of `-1`.** Whenever you see a subtraction that is *almost* a
factor you want to cancel but reversed, factor out the negative:

```
(b - a) = -(a - b)
```

This appears constantly. In Calculus I it is how nearly every difference quotient
involving a rational function collapses. Add it to your SRS deck now, as a card.

### Faded example — you supply the missing steps

```
(1/(x+2) - 1/2) / x

Numerator over common denominator 2(x+2):
    1/(x+2) - 1/2 = 2/(2(x+2)) - ______ / (2(x+2)) = ______

Divide by x:
    = ______

Cancel:
    = ______
```

*(Solution in the practice key, Set A.)*

---

## 5. Common traps

| Trap | Wrong | Right |
|---|---|---|
| Negation vs. exponent | `-3² = 9` | `-3² = -9` |
| Left-to-right division | `6 ÷ 2 · 3 = 1` | `= 9` |
| Adding denominators | `1/2 + 1/3 = 2/5` | `= 5/6` |
| Flipping the wrong fraction | `(a/b) ÷ (c/d) = (b/a)(c/d)` | `= (a/b)(d/c)` |
| Canceling across a sum | `(x + 2)/2 = x` | does not simplify |

The last one is worth dwelling on. **You may only cancel factors, never terms.**
`(2x)/2 = x` is legal because 2 is a *factor* of the numerator. `(x + 2)/2` is not,
because 2 is a *term*. Test yourself with numbers whenever you're unsure: does
`(4 + 2)/2 = 4`? No — it's 3. Trap detected.

---

## Before moving on

You are ready for Unit 02 when you can:

- [ ] Evaluate `-a^n` vs `(-a)^n` correctly without pausing
- [ ] Work a nested order-of-operations problem with no skipped lines
- [ ] Add three fractions with unlike denominators in under 30 seconds
- [ ] Simplify a complex fraction of the difference-quotient form
- [ ] Recognize and use `(b - a) = -(a - b)` on sight

Then: `unit-01-practice.md`. Attempt before reading the key — see `METHOD.md §1`.
