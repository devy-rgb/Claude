# Format Module — Narrated Funnel Walkthrough ("let me show you what I did")

A person films **their own screen** while they fill in the advertiser's own
funnel, narrating every question out loud in first person, and ends on the
approval screen. It opens on the result (a check, a balance, the finished
house), cuts to "here's the official portal, let me walk you through what I
did", then runs the form in real time — home value, amount wanted, credit band,
zip — and lands on **"boom, approved for one hundred and eighty-five thousand
dollars."**

This is the **longest format in the skill** (60–190s) and the only one that is
**captured, not generated**. Nothing in the character / identity / outfit /
gaze lock vocabulary applies, because there is no generated performer and often
no face at all. What has to stay locked is the *screen*, the *numbers* and the
*hand*.

**House workflow reference:** the refi / home-equity and personal-loan ads in the
swipe library (`Mortgage REFI`, `Personal loans`) — 59s, 73s, 142s, 186s.

---

## When this format fits the DNA

- **The funnel itself is the proof.** The mechanism the ad is selling *is* "you
  fill in a short form and a number comes back". Showing the form removes the
  entire "is this real / what do I have to do" objection in one move.
- **A specific approved figure** is the promise — a cash-out, a loan amount, a
  benefit, a settlement, a rebate. The number has to appear on a screen for the
  ad to work.
- **Product-aware or most-aware traffic** that has seen the claim and stalled on
  "yeah but what actually happens when I click".
- **The competitor ad is exactly this.** Transplant the question order and the
  narration rhythm; change the product and the numbers.

Skip it when there is no real funnel to film, when the flow is longer than about
twelve questions (the read goes flat), or when the offer is emotional rather than
numeric — the dancing / big-text and UGC formats carry those better.

---

## The beat structure (observed, in order)

| # | Beat | What carries it |
|---|---|---|
| 1 | **Result cold-open** | The payoff *first*, before any setup: the printed check on the table, the bank app, the finished house. "Okay, and here it is — my homeowner cashback check." |
| 2 | **Qualifier + promise** | Two conditions and an offer to teach. "If you own your home and your credit score is above 600, let me show you how to get this too." |
| 3 | **Portal handoff** | "Alright, so here's the official sign-up portal, let me just walk you through what I did." The screen appears here and stays. |
| 4 | **The walkthrough** | Every question read aloud and answered out loud with a **specific number**, in real time, in order. This is 60–70% of the runtime. |
| 5 | **Approval** | The screen returns a figure and the VO repeats it. "And boom — approved for one hundred and eighty-five thousand." |
| 6 | **Delivery promise** | What physically arrives, and when. "You'll get your check in the mail in a couple of days." |
| 7 | **CTA + deadline** | "Don't wait, guys — tap below before the program ends." |

Beat 4 is the format. Do not compress it into a montage; the real-time tedium is
what makes it read as a real person rather than an ad.

---

## What Stage 4 produces

There are **no image prompts and no clip prompts** for the walkthrough itself.
Stage 4's output is:

1. **The narration script**, question by question, with the answer values.
2. **A capture sheet** — the URL, the exact answers to enter, the device.
3. **A b-roll brief** for beats 1 and 6 (the check, the house, the mailbox) —
   these *can* come from the house library or be generated.
4. **The `assemble.json`.**

### 1. The narration script

Write it as `[ON SCREEN] → "spoken line"` pairs so the capture operator and the
voice stay in step:

```
[portal, landing]      "Alright, so here's the official sign-up portal.
                        Let me just walk you through what I did."
[Q: home value]        "So first up, what's the value of your home.
                        My home's worth about three hundred thousand."
[Q: mortgage balance]  "And I still owe about a hundred and twenty."
[Q: use of cash]       "What are you gonna use the cash for — I'm going with
                        paying down debt and some home upgrades."
[Q: amount]            "How much do you need. Guys, I'm going with the max."
[Q: credit band]       "Credit score — mine's around average. Not amazing,
                        but not garbage either."
[approval screen]      "And boom. Approved for a hundred and eighty-five thousand."
```

**Narration rules:**

- **First person, present tense, doing it right now.** Never "you would enter" —
  always "I'm going with".
- **Keep the filler.** "okay", "alright", "real quick", "guys", "here we go".
  A clean read kills this format; it starts sounding like a demo video.
- **Every answer is a specific number**, spoken as words (`production-discipline`
  §5 / house-playbook §5): "three hundred thousand", not "$300,000".
- **Model the ideal applicant while sounding ordinary.** The credit-band line is
  the tell: *"my credit wasn't garbage, okay, but it wasn't excellent either, so
  we're gonna go with average"* — it gives the viewer permission to pick the
  middle option instead of self-disqualifying.
- **Answer the disqualifying questions out loud and in the clear**: bankruptcies
  ("nope, clean record"), income verification ("yep, no problem"), late payments
  ("none for me"), military ("I'm not, but if you are, that might help you out
  even more"). Each one is an objection handled in four words.
- **Say the approved figure twice** — once as the screen shows it, once in the
  CTA.

### 2. The capture sheet

```
URL:        <the live funnel>
Device:     laptop screen, filmed on a phone (see production rules)
Answers:    home value 300,000 · balance 120,000 · use: debt + home improvement
            · amount: max · zip <zip> · single family · 5% · fixed · credit:
            average · bankruptcies: no · income verifiable: yes · late: no
            · military: no
End state:  approval screen showing <figure>
Runtime:    one continuous take, 45–150s
```

### 3. `assemble.json`

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/funnel-walkthrough",
  "aspect": "9:16", "size": "1080x1920",
  "banner": false, "disclosure": false,
  "music": "~/Documents/Adsora/Video Assets Raw/Soundtracks/<bed>.mp3",
  "musicVolume": 0.05,
  "jobs": [{
    "name": "funnel-walkthrough__hook-1",
    "clips": [
      { "file": "05-assets/funnel-walkthrough/01-result.mp4",  "seconds": 8 },
      { "file": "05-assets/funnel-walkthrough/02-capture.mp4", "captions": false },
      { "file": "05-assets/funnel-walkthrough/03-endcard.mp4", "seconds": 4 }
    ]
  }]
}
```

**Captions off over the capture segment.** The form fields *are* the
information; a caption track sits on top of the thing the viewer is being asked
to read, and the narration is already redundant with what is on screen. Captions
stay **on** for the result cold-open and any talking-to-camera beat. This is a
placement call inside hard rule 23, not an exemption from it — every spoken
segment that is not a screen capture is still subtitled.

---

## Production rules

1. **Film the screen with a phone. Do not screen-record.** The observed winners
   all show the laptop bezel, the macOS dock, a slice of keyboard, screen glare
   and faint moiré, with handheld drift. A pixel-clean capture reads as a
   corporate product tour and loses the format. If you only have a clean
   recording, frame it inside a filmed device rather than shipping it flat.
2. **One continuous take through the form.** No cuts, no speed-ramps, no jump
   between questions. The real-time pace is the proof.
3. **The cursor is the performance.** Hovering, a slight overshoot on a slider,
   a pause before clicking the right checkbox. Instant, perfect input reads as
   a scripted demo.
4. **Numbers are consistent end to end.** Home value, balance, requested amount
   and the approved figure must reconcile across the whole read and match the
   cold-open artifact. A check for a different number than the approval screen
   is the single most common way this format breaks.
5. **Open on the result, never on the form.** Beat 1 is a physical artifact in
   the real world. Going straight to a screen loses the scroll.
6. **Real PII never ships.** The name, address, email and phone typed on camera
   are invented, and the frame is checked at 1 fps before delivery for anything
   that leaked — a real autofill dropdown, a browser profile name, a bookmarks
   bar, a notification, a visible account avatar. This is the one review pass
   this format cannot skip.
7. **No lock vocabulary.** Skip `IDENTITY LOCK`, `OUTFIT LOCK`, `GAZE LOCK`,
   `OPENING FRAME LOCK` and the continuity block entirely — there is no
   generated performer to drift. What replaces them is rule 4 (number
   consistency) and one voice for the whole read.
8. **One voice, whole runtime.** If the cold-open has a face, the walkthrough
   narration is that same person's voice. If it is faceless, use the house
   Kokoro preset (`house-defaults.md` §1) — never switch voice at the portal
   handoff.
9. **60–190 seconds.** This format is a sales letter, not a short. Do not hold
   it to the 20–45s band; the walkthrough needs its real duration to work.

---

## What is generated vs captured

| Piece | Source |
|---|---|
| Result cold-open (check, house, bank app) | **House library first** — `Visual hooks/<NICHE>/`, `B-Roll/<NICHE>/` under `~/Documents/Adsora/Video Assets Raw/`. Generate a still → i2v only if nothing fits (hard rule 20). |
| The funnel walkthrough | **Captured.** Never generated — no current video model produces a legible, consistent multi-step form. |
| Narration | The performer's own audio, or `tools/faceless.mjs --vo-only` in the house preset. |
| End card | `tools/card.mjs`. |
| The cut | `tools/assemble.mjs` (hard rule 13). |

---

## Assembly note

Capture → trim the take to the first frame of the portal → `--plan` → render.
Check at 1 fps for rule 6 (leaked PII) and rule 4 (number consistency) before
delivery. A hook test is a different beat-1 artifact and a different opening
line over the **same** capture — log the capture once and reuse it.
