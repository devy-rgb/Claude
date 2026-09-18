# RVERT scoring (v2)

```
score = ((R1 × V) − (E + R2)) / √T  × U
```

| Symbol | Name | 1–10 | Reads as |
| --- | --- | --- | --- |
| **R1** | Real | higher better | Is the claim **believable** — is there a reason-why? |
| **V** | Value | higher better | Size of the payoff, **relative to the anchor** |
| **E** | Energy | higher worse | Attention, comprehension, clicks, typing |
| **R2** | Risk | higher worse | Spam, a salesman, looking stupid |
| **T** | Time to value | higher worse, clamped **1–6** | Time to **the payoff the ad promises** |
| **U** | Urgency | ×1.0 – ×1.9 | "Why now" — the term the original formula had no room for |

`R` appears twice in your notation (Real and Risk); the tool writes them
`R_real` and `R_risk`.

---

## Why v1 was wrong

v1 ranked vanilla "instant quote" contractor ads at the top. Three real bugs,
all confirmed against the data:

**1. REAL measured legitimacy, not believability.** It rewarded BBB / licensed /
family-owned / "since 1998" — which are *branded-contractor* tells — and
penalised bold pricing, program framing and invented mechanisms. But in
aggressive lead-gen the outrageous claim **is** the hook. What makes it land is
a **reason-why**: "factory-direct, no middlemen, discontinued shingle lines."
So v2 rewards the mechanism and only penalises a bold claim when **nothing
explains it**.

**2. T measured the wrong event.** It scored time-to-roof-installed. The ad
doesn't promise a roof, it promises *"find out if you qualify"* — which is
fast. Aggressive ads were being marked slow because their copy mentions
installation.

**3. T was a raw 1–10 divisor, so it drowned everything else.** `1/T`
correlated **0.62** with the final score — higher than any persuasion
dimension. Six of the v1 top 10 sat at the T floor, and the top-10 mean T was
2.28 against a corpus mean of 5.68. The ranking was answering *"which ads say
instant quote"*. v2 clamps T to 1–6 and uses `√T`, dropping that correlation
to ~0.33.

**4. Nothing modelled "why now."** RVERT is a static value equation: payoff vs
cost. Two ads with identical R/V/E/Rk/T score the same with and without *"11
slots left in your area this week"* — and convert very differently. Hence **U**.

## Device classes that matter

Scored into R1/V and counted separately as `aggression`:

- **price shock** — "$1,999 for a brand new roof"
- **anchor gap named** — "most companies charge $15,000 to $25,000"
- **reason-why mechanism** — factory-direct, no middlemen, discontinued lines
- **beta/trial mechanism** — "use your house to trial this", "50 homeowners
  needed". Reframes the ask as doing *them* a favour. This is the device behind
  the single most-duplicated creative in roofing (x436).
- **objection pre-empt** — "sounds impossible, but it's real", "I didn't
  believe it either". Aggressive ads raise the objection *themselves*.
- **specific scarcity count** — "13 spots left", not "limited time"
- **hard deadline + loss framing** — "after Friday, pricing goes back to retail
  permanently"
- **qualification as exclusion** — "here's who actually qualifies"
- **side-by-side price demo** — one paid $10,000, the other paid $99

## Validation

Scored against your own production scripts vs the 534 harvested creatives:

| | your scripts | Harvested corpus |
| --- | --- | --- |
| mean score | **40.3** | 2.8 |
| aggression devices | 3.8 | 0.18 |
| R (Real) | 7.3 | 4.0 |
| V (Value) | 6.6 | 3.6 |
| E (Energy) | 2.8 | 4.0 |
| R (Risk) | 3.2 | 4.7 |

His **lowest**-scoring script still beats the corpus's #10. v1 would have
ranked most of them near the bottom.

## What the scores are not

Heuristics read off copy and transcripts — **not measured performance**. The Ad
Library exposes no CTR, CPL or spend. Read RVERT next to the two behavioural
proxies that are real evidence: **lifespan** and **duplication**. A high score
on a 3-day-old creative is a hypothesis; the same score at 60 days and x50 is a
conclusion.

## The top folders

`tools/top.mjs` writes three browsable folders per run — `-aggressive-top50/`
(ranked by **aggressiveness**, see `tools/rank.mjs`: weighted pressure tactics,
ties by urgency → RVERT → duplication, geo-swaps collapsed — this is the report's
Section 1), `-new-launches/` (<14 days old by the creative's oldest clone, x3+),
and `-rvert-top20-proven/` (highest RVERT among 14d+ **and** x3+).
