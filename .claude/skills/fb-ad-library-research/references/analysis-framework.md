# Analysis framework

A script can count ads. It cannot tell you why a homeowner filled out the form.
That part is this file, and it is done by reading the actual copy.

## The target emotion

your conversion event is a **lead form fill** — low commitment, high
skepticism, zero purchase intent at the moment of the scroll. That specific
action is driven by a narrow set of emotions. Classify every ad against them.

| Trigger | The feeling | Copy fingerprint |
| --- | --- | --- |
| **Loss aversion / deadline** | "I'll miss out" | "ends Oct 31", "only for homeowners who apply before", "last round of funding" |
| **Entitlement** | "I'm owed this" | "you may qualify", "homeowners are entitled to", "you already paid for this" |
| **Suspicion of being ripped off** | "I'm being cheated" | "what roofers won't tell you", "stop overpaying", "the same roof for half" |
| **Fear of hidden damage** | "it's worse than I think" | "most roofs fail from the inside", "by the time you see a stain it's too late" |
| **Status anxiety** | "my house looks bad" | before/after, "worst roof on the block", neighbor comparisons |
| **Relief / rescue** | "someone will handle it" | "no money down", "we handle the insurance", "no salesman" |
| **Curiosity gap** | "I need to know" | "this is why your quote is so high", "3 questions to ask" |
| **Social proof / bandwagon** | "people like me did it" | "4,200 homeowners in Ohio", neighbor testimonials |
| **Insider secret** | "I have an edge" | "contractors hate this", "what the pros use" |

**Affiliate bracket leans on entitlement, deadline, and suspicion.** Branded
leans on relief, proof, and fear of damage. When a bracket borrows the other's
trigger, that's a signal — call it out.

## Angle vs hook

Keep these separate. Conflating them is the most common way this report gets
useless.

- **Angle** = the strategic premise. *"There's a relief program you qualify
  for."* Durable, reusable, survives a rewrite.
- **Hook** = the first 1–2 seconds or first line. *"Ohio homeowners — your roof
  might be covered."* Tactical, disposable, swapped constantly.

One angle spawns dozens of hooks. Track angle frequency to see *strategy*, hook
frequency to see *fatigue*.

## Angle taxonomy (home services lead-gen)

Tag every ad with one primary angle. Extend the list rather than forcing a fit.

1. **Government / relief program** — implied public funding or a formal program
2. **Eligibility quiz** — the mechanism itself is the pitch ("answer 3 questions")
3. **Price transparency / anti-overcharge** — you're being overcharged
4. **Insurance / storm damage** — your carrier should pay for this
5. **Senior / veteran specific** — demographic entitlement
6. **Free inspection** — zero-risk foot in the door
7. **Financing / no money down** — affordability objection killed up front
8. **Hidden damage / urgency** — invisible decay, acts before failure
9. **Local proof / neighborhood** — "we just did 6 roofs in <town>"
10. **Contractor exposé** — insider revealing the industry's tricks
11. **Before / after transformation** — visual status payoff
12. **Seasonal deadline** — winter, storm season, year-end
13. **Listicle / advertorial bridge** — article that funnels into the form

## Net-new angle detection

An angle is **net-new** when it appears in the current run and has **zero**
occurrences across all prior runs in `_state/history.json` for that niche.

Rank net-new finds by how seriously they're being backed:

- **Urgent** — net-new AND already high collation (scaled immediately) OR
  adopted by 2+ pages in the same week. Somebody's winner is being copied.
- **Watch** — net-new on one page, low volume. A test. Re-check next week.
- **Noise** — net-new but on a page with 1–2 total ads, or an obvious one-off.

Distinguish an angle that is **new to the niche** from one that is **new to
this page** — the second is usually a page swiping a competitor, and naming who
they swiped from is one of the most useful lines in the report.

## Trending

Compare this run's angle mix to last run's, in *share* terms, not raw counts
(raw counts move with harvest size and lie).

```
share_now = ads_with_angle / total_ads_this_run
trend     = share_now - share_prev
```

Report as **rising** (> +3pp), **flat**, **falling** (< -3pp). Always pair the
share shift with a lifespan read: a rising angle whose creatives all die in 3
days is a *failed* test wave, not a trend. Both facts, or neither.

## Hook ranking

You cannot see CTR. Rank hooks by evidence of survival and investment:

```
hook_score = 0.45 * lifespan_percentile
           + 0.35 * collation_percentile      (how widely it was duplicated)
           + 0.20 * page_conviction           (share of that page's library using it)
```

Then hard filters:

- Drop anything live < 7 days — not enough evidence.
- Drop hooks appearing on exactly one ad on one page unless lifespan > 30d.
- A hook alive 30d+ on a page with 100+ active ads outranks everything else.
  That page is a machine, and it's still running this hook.

Record hooks **verbatim**. A paraphrased hook is worthless for swiping. Capture
the first line of body copy, the `title`, and the on-screen text if legible
from the thumbnail — they're often three different hooks on the same ad.

## Reading a creative you can't watch

You have thumbnail + body + title + CTA, not the video. That is enough for:
format, opening text overlay, whether there's a face, UGC vs studio, and the
claim. It is **not** enough to describe pacing or what's said aloud.

If a creative looks important enough to need the actual video, put it in the
download queue — don't guess at its contents.
