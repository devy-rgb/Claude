# Stage 2 — ANALYZE: the persuasion DNA

**Goal:** reverse-engineer *why the competitor ad converts*, with the same rigor a
9-figure creative director applies to a winning ad — then present it as a short,
readable breakdown the user can glance at and confirm.

The analysis is not the deliverable. It exists so the rebuilt script in Stage 3
inherits the right persuasion architecture. Keep the thinking deep and the output
tight.

---

## What to extract (internal checklist — do not dump all of this raw)

Run through every item mentally. Distil into the card + table + explanation.

1. **Hook** — what stops the scroll in the first 1–3 seconds. Classify the type:
   - *curiosity loop* (an impossible/surprising claim that needs the whole ad to resolve)
   - *callout* ("if you're a [specific person] who [specific pain], this is for you")
   - *contrarian / myth-bust* ("everyone thinks X, they're wrong")
   - *bold claim + number* ("I did X in Y using Z")
   - *pattern break* (visual or format oddity — torn-paper note, ugly shot, challenge)
   - *POV / real moment* ("POV: it's 7pm and your ...")
   - *list promise* ("3 reasons your ... isn't working")
2. **Mechanism / claim** — the core promise, and the *unique mechanism* that
   makes it believable. Is it named? ("the melatonin trap", "dual-resistance
   system"). What single claim is the ad really making?
3. **Proof elements** — every device used to make the claim credible, in order:
   testimonial, specific number, demonstration, before/after, authority quote,
   3rd-party/clinical reference, screenshot, crowd consensus, founder track
   record. Note which is the *strongest* and where it lands in the runtime.
4. **Belief shift** — the single before→after belief the ad engineers.
   Write it as: **from** "[what the prospect believes walking in]" **to**
   "[what they must believe to buy]". This is the spine of the whole ad.
5. **Beat-by-beat structure** — the ordered list of moves: Hook → Problem →
   Agitation → Discovery/Story → Mechanism → Proof → Objection handle → CTA (an
   ad won't have all of these; capture the ones it uses, in order, with the
   spoken line or visual that carries each).
6. **Awareness level** — Unaware / Problem-aware / Solution-aware / Product-aware
   / Most-aware. Determines how much the ad educates vs. just closes.
7. **Market sophistication** — Stage 1 (plain claim) → Stage 5 (identity/tribe).
   Tells you how novel the mechanism framing has to be.
8. **Avatar** — who this is for, in one line (age, situation, pain, aspiration).
9. **Core desire + driver** — the primary want, and which deep driver it taps
   (survival, freedom from fear, status/superiority, social approval, comfort,
   care for loved ones, companionship, enjoyment).
10. **Emotional arc** — the feeling path across the runtime
    (e.g. Frustration → Curiosity → Hope → Urgency).
11. **NESB read** — how the ad hits **N**ew, **E**asy, **S**afe, **B**ig
    (one phrase each; note any it skips).
12. **Objections handled** — the top 1–3 doubts the ad pre-empts, and how.
13. **Competitive disqualification** — how it dismisses the alternatives the
    prospect has already tried.
14. **Winning element** — the ONE thing that most makes this outperform. If you
    could keep only one move, which is it.
15. **Format & production notes** — what the viewer literally sees (shot types,
    number of people, setting, captions, pace, music energy). Feeds Stage 4.

---

## The output — write all three parts to `02-persuasion-dna.md`

### Part A — the DNA card (≤160 words, fragments, a strategist's sticky note)

```
━━━━━━━━━━━━━━━━━━━━━━
PERSUASION DNA
━━━━━━━━━━━━━━━━━━━━━━
HOOK:        [the line/visual] — type: [curiosity loop / callout / contrarian / ...]
CLAIM:       [the one core promise]
MECHANISM:   [what makes it believable] — named: [yes: "____" / no]
PROOF:       [device 1] → [device 2] → [device 3]   (strongest: [which], at ~[timestamp])
BELIEF SHIFT: from "[walk-in belief]" → to "[buy belief]"
AVATAR:      [one line]
DESIRE:      [core want] | DRIVER: [which]
EMOTION ARC: [feeling → feeling → feeling]
AWARENESS:   [level] | SOPHISTICATION: [stage]
NESB:  N:[phrase]  E:[phrase]  S:[phrase]  B:[phrase]
OBJECTIONS HANDLED: [1], [2], [3]
WINNING ELEMENT: [the one move]
FORMAT SEEN: [shot types, people, setting, pace]
━━━━━━━━━━━━━━━━━━━━━━
```

### Part B — the beat table

One row per beat, in runtime order. Every row filled.

```
| # | ~time | Beat role        | What carries it (spoken line or visual)        | Persuasion job |
|---|-------|------------------|-----------------------------------------------|----------------|
| 1 | 0–5s  | Hook             | "…the thing nobody tells you about melatonin" | open curiosity loop, name a hidden enemy |
| 2 | 5–12s | Problem reframe  | Host: "you mean it makes it worse?"           | validate + escalate the doubt |
| 3 | …     | …                | …                                             | … |
```

### Part C — plain-English explanation (3–6 sentences)

Say, in normal prose, *why this ad works* and *what must not be lost in the
remix*. Example shape:

> This ad wins on a curiosity loop that reframes the category's default solution
> (melatonin) as the actual problem, so the prospect's failed past attempts
> become evidence *for* the pitch instead of against it. The proof stack is
> light but well-placed — one specific number and one "3rd-party tested" line,
> dropped right after the mechanism, not before. The belief shift is the whole
> game: "sleep aids leave me groggy" → "this one is engineered specifically not
> to". Keep the loop, keep the reframe-the-default move, keep the proof *after*
> the mechanism. The podcast two-shot is doing real work — the host asking the
> prospect's doubt out loud is what makes it not feel like an ad.

---

## Handoff

Write `02-persuasion-dna.md`, append the run-log line.

- **Attended mode:** update STATUS.md / `status.json` to `WAITING_REVIEW`. Show
  the user the card + table + explanation and ask: *"Does this match the ad as
  you see it? Correct anything and I'll fold it in, otherwise I'll remap it onto
  your product."* Proceed to Stage 3 on confirmation or a short pause with no
  objection (soft stop, not the hard gate).
- **Hands-off mode:** do not stop. The breakdown is still written and logged for
  the user to read later. Proceed straight to Stage 3.
