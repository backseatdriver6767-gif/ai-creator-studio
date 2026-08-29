# The Automaticity Deck

Everything in this file must become **reflex, not derivation**. Under three
seconds, no scratch paper, no reconstruction.

Load these into Anki (or any SRS tool) and run the daily 10-minute block described
in `METHOD.md`. Add each block only when you reach the corresponding unit —
front-loading the whole deck buries you.

**The three-second rule:** a card you answer correctly in eight seconds is a
*failed* card. Mark it again. The goal isn't knowing these — it's not having to
think about them, so that working memory stays free for the actual problem.

---

## Block 1 — Exponent & Radical Laws (add Week 2)

```
x^a · x^b = x^(a+b)
x^a / x^b = x^(a-b)
(x^a)^b = x^(ab)
(xy)^a = x^a · y^a
(x/y)^a = x^a / y^a
x^0 = 1          (x ≠ 0)
x^-a = 1/x^a
x^(1/n) = ⁿ√x
x^(m/n) = ⁿ√(x^m) = (ⁿ√x)^m
√(ab) = √a · √b
√(a/b) = √a / √b
```

**Not a law — memorize as a trap card:** `√(a + b) ≠ √a + √b`, and
`(a + b)^2 ≠ a^2 + b^2`. These two false "laws" cause more silent errors than any
true law prevents.

---

## Block 2 — Factoring Patterns (add Week 5)

```
a² - b²        = (a - b)(a + b)
a² + 2ab + b²  = (a + b)²
a² - 2ab + b²  = (a - b)²
a³ - b³        = (a - b)(a² + ab + b²)
a³ + b³        = (a + b)(a² - ab + b²)
```

Memory hook for the cubes: **SOAP** — **S**ame sign, **O**pposite sign,
**A**lways **P**ositive. The binomial takes the same sign as the original, the
middle term of the trinomial takes the opposite sign, the last term is always
positive.

**Note:** `a² + b²` does not factor over the real numbers. Recognizing this
instantly saves time you'd otherwise spend hunting.

---

## Block 3 — Quadratics (add Week 6)

```
Quadratic formula:  x = (-b ± √(b² - 4ac)) / (2a)
Discriminant:       D = b² - 4ac
  D > 0  → two distinct real roots
  D = 0  → one repeated real root
  D < 0  → two complex roots
Vertex of y = ax² + bx + c:  x = -b/(2a)
Completing the square: take half of b, square it, add and subtract it
```

---

## Block 4 — The Unit Circle (add Week 14) — **the most important block**

Every angle, as `(cos θ, sin θ)`:

| θ | (cos, sin) | | θ | (cos, sin) |
|---|---|---|---|---|
| `0` | `(1, 0)` | | `π` | `(-1, 0)` |
| `π/6` | `(√3/2, 1/2)` | | `7π/6` | `(-√3/2, -1/2)` |
| `π/4` | `(√2/2, √2/2)` | | `5π/4` | `(-√2/2, -√2/2)` |
| `π/3` | `(1/2, √3/2)` | | `4π/3` | `(-1/2, -√3/2)` |
| `π/2` | `(0, 1)` | | `3π/2` | `(0, -1)` |
| `2π/3` | `(-1/2, √3/2)` | | `5π/3` | `(1/2, -√3/2)` |
| `3π/4` | `(-√2/2, √2/2)` | | `7π/4` | `(√2/2, -√2/2)` |
| `5π/6` | `(-√3/2, 1/2)` | | `11π/6` | `(√3/2, -1/2)` |

`tan θ = sin θ / cos θ`, undefined where `cos θ = 0` (at `π/2` and `3π/2`).

**Sign pattern by quadrant — "All Students Take Calculus":**
QI all positive · QII sine positive · QIII tangent positive · QIV cosine positive.

**Gate requirement:** all 16 angles, cos/sin/tan, under 3 minutes, 100%. This is a
hard sub-gate on Exam C. Build to it with daily 60-second sprints starting Week 14
and never stop — this block stays in the deck for the rest of the program.

---

## Block 5 — Trig Identities (add Weeks 17–18)

**Pythagorean:**
```
sin²θ + cos²θ = 1
1 + tan²θ = sec²θ
1 + cot²θ = csc²θ
```

**Reciprocal & quotient:**
```
cscθ = 1/sinθ    secθ = 1/cosθ    cotθ = 1/tanθ
tanθ = sinθ/cosθ    cotθ = cosθ/sinθ
```

**Even/odd:**
```
sin(-θ) = -sinθ    cos(-θ) = cosθ    tan(-θ) = -tanθ
```

**Sum & difference:**
```
sin(A ± B) = sinA·cosB ± cosA·sinB
cos(A ± B) = cosA·cosB ∓ sinA·sinB      ← note the flipped sign
tan(A ± B) = (tanA ± tanB) / (1 ∓ tanA·tanB)
```

**Double angle:**
```
sin(2θ) = 2·sinθ·cosθ
cos(2θ) = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ
tan(2θ) = 2tanθ / (1 - tan²θ)
```

**Power reduction** — memorize these specifically. They are what makes
trigonometric integrals in Week 44 tractable:
```
sin²θ = (1 - cos2θ)/2
cos²θ = (1 + cos2θ)/2
```

---

## Block 6 — Logarithms (add Week 11)

```
log_b(xy) = log_b(x) + log_b(y)
log_b(x/y) = log_b(x) - log_b(y)
log_b(x^n) = n·log_b(x)
log_b(b) = 1      log_b(1) = 0
b^(log_b x) = x   log_b(b^x) = x
Change of base:  log_b(x) = ln(x)/ln(b)
```

**Trap cards:** `log(x + y) ≠ log x + log y`, and `log(x)/log(y) ≠ log(x/y)`.

---

## Block 7 — Derivative Rules (add Weeks 30–35)

```
d/dx [xⁿ]      = n·xⁿ⁻¹
d/dx [sin x]   = cos x
d/dx [cos x]   = -sin x
d/dx [tan x]   = sec²x
d/dx [sec x]   = sec x · tan x
d/dx [csc x]   = -csc x · cot x
d/dx [cot x]   = -csc²x
d/dx [eˣ]      = eˣ
d/dx [ln x]    = 1/x
d/dx [aˣ]      = aˣ · ln a
d/dx [arcsin x] = 1/√(1 - x²)
d/dx [arctan x] = 1/(1 + x²)

Product:   (fg)' = f'g + fg'
Quotient:  (f/g)' = (f'g - fg') / g²
Chain:     (f(g(x)))' = f'(g(x)) · g'(x)
```

Quotient rule mnemonic: *low d-high minus high d-low, over low squared.* The
order matters — unlike the product rule, this one is not symmetric, and swapping
the terms is the most common quotient-rule error.

---

## Block 8 — Integral Rules (add Weeks 41+)

```
∫ xⁿ dx        = xⁿ⁺¹/(n+1) + C     (n ≠ -1)
∫ (1/x) dx     = ln|x| + C           ← the n = -1 case; note the absolute value
∫ eˣ dx        = eˣ + C
∫ sin x dx     = -cos x + C
∫ cos x dx     = sin x + C
∫ sec²x dx     = tan x + C
∫ sec x·tan x dx = sec x + C
∫ 1/(1 + x²) dx  = arctan x + C
∫ 1/√(1 - x²) dx = arcsin x + C

Integration by parts:  ∫ u dv = uv - ∫ v du
```

For parts, choose `u` by **LIATE**: Logarithmic, Inverse trig, Algebraic,
Trigonometric, Exponential — whichever appears first in that list becomes `u`.

---

## Maintenance

Blocks never graduate out of the deck. Once added, a block stays in rotation for
the remainder of the program — the SRS algorithm will space mature cards out to
months, so the cost of keeping them approaches zero while the benefit does not.

The unit circle in particular stays daily through Week 20 and stays in rotation
permanently.
