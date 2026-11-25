# Pipeline Mechanics, Gates & the Status File

This file defines how the five stages hand off, where the hard stops are, and the
one status file that makes a run checkable from a phone.

---

## 1. The run folder

The moment INTAKE starts, create the run folder **in the user's current working
directory** (the folder they opened in Claude Code — never inside the skill's own
install folder):

```
ad-remix-runs/<YYYY-MM-DD>-<slug>/
```

`<slug>` is a short kebab-case tag for the competitor ad, e.g.
`2026-09-02-sleep-gummy-podcast`. Everything for this run lives here:

```
<run-folder>/
├── STATUS.md              ← human-readable status, overwritten every transition
├── status.json            ← machine twin of STATUS.md
├── 01-intake.md           ← the competitor ad as received + source notes
├── 02-persuasion-dna.md   ← the Stage 2 breakdown
├── 03-rebuild.md          ← the new script + avatar/character (the approved version)
├── 04-prompts/            ← one file per format, filled in Stage 4
│   ├── podcast-duo.md
│   ├── ugc-yapper.md
│   └── ...
├── 05-assets/             ← generated images/video (Stage 5), if a backend ran
├── 06-finals/             ← finished ads cut by the skill (Stage 5), one folder per format
└── run-log.md             ← appended at every meaningful step
```

Create files as each stage produces them. Do not pre-create empty stubs except
`STATUS.md` / `status.json`, which exist from the first moment.

---

## 2. Stage transitions and gates

| From → To | What must be true to cross | Stop for the user? (attended) | In hands-off mode (§8) |
|---|---|---|---|
| start → **INTAKE** | user supplied a competitor ad in some form | no | no |
| INTAKE → **ANALYZE** | source recorded, ad content captured in `01-intake.md` | no | no |
| ANALYZE → **REBUILD** | breakdown written to `02-persuasion-dna.md` and shown | **soft stop** — show the breakdown, invite corrections, proceed on "looks right" or after a short pause with no objection | auto-pass (breakdown still written + logged) |
| REBUILD → **FAN OUT** | new script + character written, shown | **HARD STOP** — require explicit "approved" / "go" / edits-then-go. Never cross this on silence. | **HARD STOP — unchanged.** Push a notification (§7), set `BLOCKED_ON_APPROVAL`, wait. This gate is never automated. |
| FAN OUT → **GENERATE** | prompts written for every chosen format, shown | **soft stop** — confirm format list and that the user wants to spend on generation (or wants prompt-only) | auto-pass using the pre-committed format list + `auto_generate` |
| GENERATE cost quote | per-asset cost table built | **soft stop** — wait for "go" | auto-pass **only if** total ≤ pre-approved budget; otherwise stop + notify |
| GENERATE → **done** | assets generated or prompts delivered; run log + status finalized | no | no — push a "done" notification (§7) |

**The one inviolable gate is REBUILD → FAN OUT.** Stage 4 and Stage 5 are where
time and credits get spent. The script and the on-screen character must be
signed off in words before you write a single production prompt. Hands-off mode
automates the *soft* stops around it; it never automates this one.

If the skill is invoked in an unattended / automation context (no user present to
approve), it runs through ANALYZE, writes the REBUILD draft, sets the status to
`BLOCKED_ON_APPROVAL`, pushes the checkpoint notification, and **stops**. It does
not guess approval.

---

## 3. STATUS.md — the template

Overwrite this file completely on every stage transition. Keep it short enough to
read on a phone without scrolling.

```markdown
# Remix run: <slug>

**Stage:** 3 of 5 — REBUILD
**State:** ⛔ BLOCKED — waiting for your approval to continue
**Updated:** 2026-09-02 14:07

## Done
- ✅ INTAKE — competitor ad received (transcript, ~38s sleep-gummy podcast clip)
- ✅ ANALYZE — persuasion DNA extracted → 02-persuasion-dna.md
- ✅ REBUILD draft — new script + character written → 03-rebuild.md

## Waiting on you
Review 03-rebuild.md. Reply "approved" to continue, or send edits.
Nothing will be generated (no credits spent) until you approve.
📲 Notification sent.

## Next when you approve  (hands-off mode — no more taps needed)
Stage 4 — FAN OUT: build prompts for ugc-yapper, podcast-duo, whiteboard-marker-explainer, simpsons-flat-2d
Stage 5 — GENERATE: Evolink (face UGC on Adsora Gen), auto-run up to $5.00. You'll get a "done" notification.
```

**State values:** `RUNNING`, `WAITING_REVIEW` (soft stop), `BLOCKED_ON_APPROVAL`
(hard stop — the REBUILD gate), `NEEDS_A_CALL` (stalled mid-GENERATE: over
budget, content filter, or auth/connection failure), `DONE`, `FAILED`.

The "Next when you approve" block reflects the mode: in **attended** mode it says
"build prompts for [your pick], then confirm before generating"; in **hands-off**
mode it names the pre-committed formats and budget and says no more taps are
needed after the one approval.

---

## 4. status.json — the machine twin

```json
{
  "slug": "2026-09-02-sleep-gummy-podcast",
  "stage": 3,
  "stage_name": "REBUILD",
  "state": "BLOCKED_ON_APPROVAL",
  "updated": "2026-09-02T14:07:00Z",
  "blocked_on_user": true,
  "blocking_question": "Approve 03-rebuild.md to fan out to formats?",
  "done": ["INTAKE", "ANALYZE", "REBUILD_DRAFT"],
  "next": ["FAN_OUT", "GENERATE"],
  "hands_off": true,
  "formats_selected": ["ugc-yapper", "podcast-duo", "whiteboard-marker-explainer", "simpsons-flat-2d"],
  "auto_generate": true,
  "budget_preapproved_usd": 5.00,
  "notifications": [
    {"at": "2026-09-02T14:07:00Z", "event": "REBUILD_READY", "sent": true}
  ],
  "generator": {"adapter": "evolink", "detected": true, "via": "env",
                 "per_format": {"ugc-yapper": "adsoragen", "podcast-duo": "evolink"}},
  "spend": {"currency": "USD", "estimated": 0, "actual": 0},
  "artifacts": {
    "intake": "01-intake.md",
    "dna": "02-persuasion-dna.md",
    "rebuild": "03-rebuild.md",
    "prompts_dir": "04-prompts/",
    "assets_dir": "05-assets/",
    "run_log": "run-log.md"
  }
}
```

Keep the two files consistent — every time you write one, write the other.

---

## 5. run-log.md — what to append

Append a timestamped line at every meaningful step. This is the audit trail the
task requires: *what was analyzed, what was approved, what was generated, and cost
where the backend reports it.*

```markdown
- 2026-09-02 13:40 — INTAKE — received transcript, 38s, "sleep gummy" podcast-duo ad. Source: user paste. Mode: hands-off (formats: ugc-yapper, podcast-duo, whiteboard-marker-explainer, simpsons-flat-2d; auto-generate ≤ $5.00).
- 2026-09-02 13:52 — ANALYZE — DNA extracted. Hook type: curiosity-loop. Belief shift: "sleep aids leave me groggy" → "this one doesn't". 7 beats. (hands-off: soft stop auto-passed)
- 2026-09-02 14:07 — REBUILD — draft script + character written for [PRODUCT]. NOTIFY sent (REBUILD_READY). Awaiting approval — BLOCKED_ON_APPROVAL.
- 2026-09-02 15:30 — APPROVED — user approved 03-rebuild.md from phone with 1 edit (shortened CTA line).
- 2026-09-02 15:31 — FAN OUT — hands-off: no format prompt. Prompts written: ugc-yapper, podcast-duo, whiteboard-marker-explainer, simpsons-flat-2d.
- 2026-09-02 15:33 — GENERATE — hands-off: cost quote $3.90 ≤ $5.00 pre-approved, auto-proceeded. adapter: evolink (ugc-yapper → adsoragen). 11 stills + 12 clips. Reported cost: $3.72. Assets in 05-assets/.
- 2026-09-02 16:04 — DONE — NOTIFY sent (RUN_DONE).
```

---

## 6. Resuming a run

If the user comes back and says "continue" / "where are we", read `status.json`,
report the STATUS.md contents in five lines, and pick up at the blocked step. Do
not restart earlier stages unless the user asks or an artifact is missing.

---

## 7. Notifications

The pipeline pushes a phone notification at exactly the moments a person needs to
act or wants to know it landed — no chatter in between. Use the `PushNotification`
tool (the harness handles delivery to whatever device the user has registered).

| Event | When | Message (keep it one line, actionable) |
|---|---|---|
| `REBUILD_READY` | REBUILD draft written, status set to `BLOCKED_ON_APPROVAL` | `Remix "<slug>": script + avatar ready. Open 03-rebuild.md and reply "approved" to run it.` |
| `RUN_DONE` | GENERATE finished, status `DONE` | `Remix "<slug>": done. <N> clips across <M> formats in ad-remix-runs/<slug>/. Cost $<x>.` |
| `NEEDS_A_CALL` | pipeline stopped mid-GENERATE — over budget, content filter, adapter/auth failure, or a blocking `[NEED TO CONFIRM]` | `Remix "<slug>": stopped at GENERATE — <one-line reason>. Needs your call.` |

Rules:
- **Exactly these three.** Do not notify on INTAKE, ANALYZE, or FAN OUT — those
  are progress, not decisions. The status file already carries progress.
- Every notification is also written to `status.json` `notifications[]` and to
  `run-log.md` as a `NOTIFY sent (<event>)` line.
- If `PushNotification` is unavailable in the current environment, degrade
  silently to the status file + run log (do not error), and say once in chat that
  notifications aren't available here so the user knows to check STATUS.md.
- One `REBUILD_READY` per run. If the user sends edits and you rewrite the draft,
  do **not** re-notify unless they walked away again (they're clearly present).

---

## 8. Hands-off mode

**Trigger:** the user kicks off with a phrase like "remix this and run it
hands-off" / "…on autopilot" / "…from my phone", or `config/generators.json` has
`default_adapter` set and the user says "just run it". Also settable per-run.

**What it changes:** the pipeline still hard-stops once — at REBUILD, for the
script + avatar approval — but every *soft* stop around it is pre-decided so a
single "approved" cascades through to finished assets with no further prompts.

**At kickoff, capture (or take from `config` → `hands_off`):**
- `formats_selected` — the list to build. Default from config
  (`hands_off.default_formats`), else ask once at kickoff, else "all 9".
- `auto_generate` — true = run the generator after FAN OUT; false = stop at
  prompts. Default from config, else true when an adapter is detected.
- `budget_preapproved_usd` — the ceiling the cost quote may auto-pass under.
  Default = `budget_usd` from config ($5.00). The quote is still built and logged;
  it just doesn't wait for "go" if it's under this number.

Write all three into `status.json` at INTAKE so a resumed run knows the plan.

**The run then goes:**
1. INTAKE → ANALYZE → REBUILD draft, no stops. Breakdown still written to
   `02-persuasion-dna.md` and logged (the user can read it later).
2. **STOP at REBUILD.** `BLOCKED_ON_APPROVAL`, push `REBUILD_READY`. Wait.
3. On "approved" (with or without edits): fold edits in, then **do not ask about
   formats or about generating** — use the captured plan. FAN OUT writes all the
   prompt files.
4. GENERATE: build the cost table, log it. If total ≤ `budget_preapproved_usd`,
   proceed. If over, stop, set `NEEDS_A_CALL`, push the notification, wait.
5. Download assets, finalize `DONE`, push `RUN_DONE`.

**Never automate in hands-off mode:**
- the REBUILD script/avatar approval (always a human "approved");
- spending over `budget_preapproved_usd`;
- a run that hit a content-filter rejection twice, or an adapter/auth failure —
  those become `NEEDS_A_CALL`.

**Attended mode** (no trigger phrase) is unchanged: every soft stop still asks.
