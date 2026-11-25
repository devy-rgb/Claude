# Stage 1 — INTAKE

**Goal:** get the competitor ad into a fixed, referenceable form before any
analysis. Cheap to redo, so get it right.

---

## Accepted inputs

| Form | What you do | What to ask for if thin |
|---|---|---|
| **Video file** (uploaded or path) | View frames if you can. Transcribe the spoken track. Log timings, on-screen text, cuts, who is on screen. | If you cannot view it: ask the user to paste a transcript and describe the visuals beat by beat (or drop 4–8 screenshots across the runtime). |
| **Transcript** (paste) | Take it verbatim. Ask for rough timings if none, and a one-line note on the visual format (talking head? podcast two-shot? animation? screen recording?). | Ask: "roughly how long is it, and what does the viewer actually see?" |
| **Description / write-up** | Take the user's account of what happens. | Ask for the actual hook line verbatim if they remember it, and the CTA line. Those two lines carry disproportionate weight. |
| **Screenshots / stills** | Read every element in each frame: on-screen text, product, setting, person, expression, captions. Order them by likely timestamp. | Ask for the spoken hook and CTA if not visible in the stills. |
| **URL** | Ask the user to download it or paste the transcript — do not assume you can fetch it. Treat whatever they bring back as one of the forms above. | — |

You need, at minimum, to be able to answer: **what is the hook, what is being
claimed, what proof is shown, what does the CTA ask for, and roughly in what
order do the beats run.** If any of those is missing, ask one tight question
before moving on.

---

## Reconstructing a source with no transcript

When the user hands you a video file and no transcript (and no speech-to-text is
reachable), reconstruct it from frames — this is the operator's real method
(`references/house-workflows/yapping-talking-head.md`,
`comedy-two-hander-ugc.md`):

- **Ignore the filename.** Downloader/scraper tools slap generic spam names on
  files ("scenic world culture moments") that have nothing to do with the
  content. Judge only what's in the frames.
- **Extract frames with ffmpeg, one per second:**
  ```bash
  ffmpeg -i input.mp4 -vf fps=1 frames/f_%04d.png
  ```
- **Read static on-screen text with a median-stack composite.** If a moving
  subject keeps covering a static list or title, average all the frames together
  — the subject blurs out and the static text underneath becomes readable. (Any
  image tool with a median/median-blend stack mode; or a few lines of Python with
  numpy.)
- **Read burned captions frame by frame** across the sequence.
- **Log, don't invent.** Record Setting / Framing / Movements / subject behaviour
  / Audio register. If you could not get a reliable transcript, say so — never
  present a guessed transcript as fact.
- **Never carry real identifying details forward.** Match staging, pacing, camera
  style and general energy only. The real people, real names, real script, and
  specific physical details (a real tattoo, a real child) belong to real private
  individuals and are not reproduced. Every rebuilt character is original and
  fictional (Stage 3 handles this).

---

## What to record in `01-intake.md`

```markdown
# INTAKE

**Received:** 2026-09-02, user paste
**Source form:** transcript + one-line visual note
**Runtime:** ~38 seconds
**Visual format:** podcast two-shot, two people, mics visible, warm studio
**What it sells (one line):** a sleep gummy that claims no morning grogginess

## Verbatim hook
"...and that's the thing nobody tells you about melatonin."

## Verbatim CTA
"Link's in the bio, just try one night."

## Transcript / beat notes
[00:00–00:05] Guest, mid-sentence: "...and that's the thing nobody tells you about melatonin."
[00:05–00:12] Host: "Wait, back up — what do you mean it makes it worse?"
[00:12–00:22] Guest explains the 'melatonin hangover', names the mechanism...
[... full transcript with timings ...]

## On-screen text seen
- 0:03 caption: "the melatonin trap"
- 0:26 caption: "0 grogginess"

## Notes / uncertainties
- Couldn't verify the "3rd-party tested" claim shows a document or is spoken only.
```

---

## Detect the run mode

If the kickoff message contains "hands-off" / "on autopilot" / "from my phone" /
"just run it", this is a **hands-off run** (`references/pipeline-and-status.md`
§8). Capture and write into `status.json` now:
- `hands_off: true`
- `formats_selected` — from `config/generators.json` → `hands_off.default_formats`
  if set; else ask the one question "which formats? (default: all 9)" here at
  kickoff so nothing interrupts later; else `["all"]`.
- `auto_generate` — from config; else `true` if a generation adapter is detected.
- `budget_preapproved_usd` — from config `budget_usd`; else `5.00`.

Otherwise `hands_off: false` (attended mode — every soft stop asks).

## Handoff

Write `01-intake.md`, append the run-log line (note the mode + captured plan if
hands-off), update STATUS.md / `status.json` to Stage 2, and proceed to ANALYZE
**without stopping** (INTAKE → ANALYZE has no gate). Do not begin ANALYZE until
the five minimum facts above are answered.
