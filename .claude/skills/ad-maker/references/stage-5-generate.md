# Stage 5 — GENERATE & DELIVER

**Goal:** turn the Stage 4 prompts into assets through the configured backend, or
hand them back paste-ready if none is configured — then cut those assets into
finished ads yourself with `tools/assemble.mjs`. Save everything (assets + finals
+ prompts + run log) to the dated run folder.

**Precondition:** the user has seen the Stage 4 prompts and asked to generate (or
asked for prompt-only). Formats are recorded in `status.json`.

---

## Step 1 — resolve the adapter

Read `config/generators.json` (or use the built-in defaults if absent — default
adapter is `evolink`). Run the detection order in
`references/generation-adapters.md` §4, then apply the per-format `routing`
overrides on top of it. For the face UGC route run
`node tools/adsoragen.mjs --health` (keys from the skill's own
`config/adsoragen.env`, graphs from `config/adsoragen/`): `LIVE` means Adsora
Gen, anything else means the fallback and a line in the quote saying so.
Announce the result:

> Generator: **Evolink** (key found). Face UGC goes to **Adsora Gen** (our GPU);
> the faceless ads render locally. I'll quote the cost before spending.

or, if the configured adapter's credentials aren't present:

> Config points at Evolink but `EVOLINK_API_KEY` isn't set in this folder's
> `.env`. Add it and say "continue" — or I can run **prompt-only** now and you
> generate yourself.

or, if Adsora Gen is unconfigured but face UGC was picked — say it, don't skip it:

> Adsora Gen isn't live here (`tools/adsoragen.mjs --health`: <what it named —
> the key, the endpoint or a graph — missing from `config/adsoragen.env` /
> `config/adsoragen/`>), so the face UGC formats fall back to Evolink (Seedance)
> at vendor pricing. That's the cost table below.

or, nothing available:

> No generator configured. Running **prompt-only** — you'll get every prompt
> paste-ready with instructions.

Write the result into `status.json` (`generator`), including the `per_format` map.

---

## Step 1b — pull footage from the house library first

Before quoting, resolve every b-roll, opener, background and cutaway need
against the local raw-assets library (hard rule 16):

- `~/Documents/Adsora/Video Assets Raw/B-Roll/<NICHE>` — cutaways and faceless b-roll
- `~/Documents/Adsora/Video Assets Raw/Visual hooks/<NICHE>` — 5s AI openers
- (`Soundtracks` and `Voiceovers` sit beside them; music still has to be a
  cleared bed)

Match the niche folder to the product (BATH, ROOF, GUTTERS, HVAC, …; create a
new one if the niche is new). Point `brollDir` / `hooksDir` / `broll.dir` /
`cutaways` at those folders and drop the matching generation jobs from the
quote. Only footage that is genuinely missing gets a generation row, and each
such clip is saved to **both** the run folder and the matching library folder
the moment it lands. Face-to-camera performance clips are not library footage;
they stay in the run folder.

---

## Step 2 — quote (if an adapter is live)

**Gate 1 first: `node tools/qa.mjs lint <every jobs file for this format>`.** It
runs before a cent is quoted, let alone spent. A FAIL is fixed in the prompts and
re-linted — never quoted around. It catches British vocabulary that would draw a
UK street, voice lines with no named US region, "mid-Atlantic", more than one
spoken line in a clip, a person re-described in a still with no reference image,
and prompt framing the model would speak ("They say:"). Warnings are read and
either fixed or accepted in the run log. `qa-lint.json` lands beside the jobs file.

Build a per-asset cost table from `get_cost_estimate` (or the price notes in
`references/model-specs.md`). Round up.

```
| Asset             | Op          | Adapter · model                          | Est. |
|-------------------|-------------|------------------------------------------|------|
| podcast Frame A   | image       | evolink · gpt-image-2                    | $0.__|
| podcast Frame B   | image (ref) | evolink · gpt-image-2 + image_urls       | $0.__|
| podcast Clip 1    | video (i2v) | adsoragen · adsora-gen-2.0-i2v, 6s @480p (native audio; `adsoragen.mjs --plan`) — evolink · seedance-2.0-fast-i2v only on fallback | $0.__|
| yapper Clip 1     | video (avatar) | adsoragen · adsora-avatar-2.0, 6.6s @480p (`adsoragen.mjs --plan`) | $0.__|
| faceless ad-01    | render      | local · tools/faceless.mjs               | $0.00|
| talking-head final| assemble    | local · tools/assemble.mjs (local whisper timing) | $0.00|
| ...               |             |                                          |      |
| TOTAL             |             |                                          | $_.__|
```

(Fill costs from the price notes in `references/model-specs.md`. Adsora Gen rows
come from `node tools/adsoragen.mjs 05-assets/<format>/adsoragen.json --plan` —
GPU time, ≈ $0.11 for 5s and ≈ $0.55 for 15s at 480p, 720p about double, growing
superlinearly with clip length. Faceless renders are $0.00 — list them anyway so
the row count is honest. Round up. Mark "estimate" where the number isn't
reported back.)

Rules:
- **Never exceed `budget_usd`** in the config without explicit user confirmation.
- More than ~12 jobs in one run, or a total over $5, needs an explicit "yes"
  even if under budget.
- **Draft first:** render images at the cheap quality and video at 480p. Upscale
  / re-render at high quality only the assets the user picks as winners.
- **Attended mode:** show the table, wait for "go". Do not fire on silence.
- **Hands-off mode:** still build and log the table. If TOTAL ≤
  `budget_preapproved_usd` **and** the job count is ≤ 12, proceed automatically.
  If it's over either limit, do not generate: set state `NEEDS_A_CALL`, push the
  `NEEDS_A_CALL` notification with the number, write the prompt-only delivery so
  nothing is lost, and stop.

---

## Step 3 — generate

For each format, in this order: **stills first (manifest order) → then clips (cut
order)**. A clip that continues from a previous clip uses that clip's last frame
(harvest it) as its start frame.

Use the adapter this format resolved to in Step 1, not the run default — face UGC
and faceless formats each go somewhere else.

- Call the adapter's `generate_image` / `generate_video` with the exact prompt
  text from `04-prompts/<format>.md` — do not paraphrase prompts at generation
  time.
- **Evolink:** POST returns a task id; poll `GET /v1/tasks/{id}` until it
  completes. Send `size` on images and `aspect_ratio` on videos — unknown keys are
  ignored, billed, and silently wrong. Scrub brand words (iPhone, TikTok, GoPro…)
  from what you send or Seedance rejects the whole job.
- **Adsora Gen (face UGC):** write `05-assets/<format>/adsoragen.json`
  (`tools/adsoragen.example.json` is the template — `avatar` jobs take the
  reference portrait plus the voice WAV made first with
  `tools/faceless.mjs --vo-only`, ≤ 14.7s of speech each; `i2v` / `t2v` jobs
  take a start frame / prose plus `seconds`), run
  `node tools/adsoragen.mjs 05-assets/<format>/adsoragen.json --plan` for the
  quote, then the same without `--plan` to generate. The tool submits to the
  RunPod endpoint **through the API, from this machine**, polls
  `runpod:<endpointId>:<jobId>`, saves each finished clip straight to `outDir`
  (hard rule 15) with your exact voice muxed back over H3's picture, and
  writes `adsoragen.results.json` (job id, seed, executionTime, real cost) —
  one run-log line per clip from it. Never generate in the Adsora Gen web app
  or a browser tab, and never leave a clip only on the server. If you give up
  on a job, `node tools/adsoragen.mjs --cancel <jobId>` — an abandoned job
  still runs and still bills. Full procedure: `references/adsoragen-video.md`.
- **Faceless:** no API call. Write the jobs file and run
  `node tools/faceless.mjs jobs.json` with `outDir` pointed at
  `05-assets/faceless-vo-broll/`. Read its `manifest.json` for what rendered and
  what failed. Full procedure: `references/faceless-video.md`.
- **Voice only (moving-bg-vo-text):** `node tools/faceless.mjs vo.json --vo-only`
  writes one WAV per hook into `05-assets/moving-bg-vo-text/`; the picture is
  the assembly pass (a looped background under `audio` + `script`).
- **Songs & music (cartoon-music-video, or a bed the pool can't cover):** no API
  call. `node tools/song.mjs --health` first (LIVE = ACE-Step installed), then
  `node tools/song.mjs 05-assets/song/song.json --plan` and the same without
  `--plan` to generate. Tracks land in `outDir` as `<name>.<fmt>`; local, free
  ($0.00). For **cartoon-music-video, generate and approve the song first** — every
  shot cuts to it. If `--health` is not LIVE, a bed falls back to the
  `Soundtracks/` pool and the music-video degrades to prompt-only (hand back the
  lyrics + a note). Full procedure: `references/song-maker.md`.
- **Cards (reply-to-comment bubble, headline callout, notes card, legal box):**
  `node tools/card.mjs 05-assets/cards/cards.json` before assembly. Local,
  free, needs the machine's Chrome; without it, say so once and use `text`
  blocks in `assemble.json` instead.
- **Text-first formats** generate at most one still + one clip (or none, when
  a house clip fits); everything else in them is local.
- Download every output immediately to `05-assets/<format>/`
  (`frame-a.png`, `clip-1.mp4`, ...). Signed URLs expire. Generated b-roll,
  opener, background or cutaway footage is also copied into the matching
  `~/Documents/Adsora/Video Assets Raw/` niche folder (hard rule 16).
- Append a run-log line per job: prompt (first ~100 chars), model, params, status,
  reported/estimated cost, local path.
- On failure: log `status: failed`, retry once with softened phrasing if it looks
  like a content filter. If it fails again, or the adapter throws an auth/connection
  error: **attended** → stop and ask the user; **hands-off** → finalize the assets
  that did land, set state `NEEDS_A_CALL`, push the `NEEDS_A_CALL` notification with
  the one-line reason, and stop. Treat retries as new spend.

**Trim, then Gate 2, before any assembly.**
`node tools/qa.mjs trim <format jobs.json>` writes `trims.json`: every one-line
clip cut to its first complete reading, dropping a repeat the model spoke to fill
the clip and any garbled words before the line. It finds the cut from the pauses
in the audio, because whisper's word timings collapse on repeated speech. Then
**`node tools/qa.mjs clips <format jobs.json> --trims trims.json`**
(or `clips <clip.mp4 …> --script lines.txt --trims trims.json`), which judges only
the trimmed window, and copy each clip's `in` / `seconds` from `trims.json` into
`assemble.json`. Local, about 1–2 s per clip. It
runs an accent classifier on every spoken clip (North-American margin ≥ +0.10;
`tools/accent_check.py`) and compares each clip's transcript to its line:
missing words, the line spoken twice, unscripted words before it. **A FAIL is a
re-roll of that clip** (or, for a repeat or a short head leak, a trim noted in the
assembly file) — never a caption edit, and never "it'll be fine under music".
Re-run the gate on the replacements until it passes; `qa-clips.json` must read
PASS before Step 4.

If **prompt-only**: skip generation. Copy each `04-prompts/<format>.md` into the
delivery, add the "where to paste each one" note (tool + slot + resolution per
`references/generation-adapters.md` §4).

---

## Step 4 — assemble the finals (the skill cuts them, never the user)

Generated clips are not the deliverable; a finished ad is. For every format that
produced clips, run the assembly pass yourself — never write "add captions in
CapCut" or "cut b-roll over T2" as an open item:

1. Write `06-finals/<format>/assemble.json` from that format's Stage 4 assembly
   note: clips in cut order (the `-v2` re-roll where one exists), each talking
   clip's exact spoken words as its `script` (captions are the written words,
   timed by the heard ones), b-roll `cutaways` / `broll` where the note says
   the picture leaves the face, `audio` swaps for any ElevenLabs-repaired line,
   the `banner`, `"disclosure": false` (hard rule 14), the `endCard`, label `overlays`, any
   `split` before/after. `tools/assemble.example.json` is the template.
2. `node tools/assemble.mjs 06-finals/<format>/assemble.json --plan` — check
   the runtime against the DNA's band, then run it without `--plan`.
3. Read its `manifest.json`: every captioned clip's heard transcript is there —
   check the numbers, the price and the offer line before shipping. A wrong
   number means a wrong clip (re-roll or swap its audio), never a caption edit.
   Frame-review the final at 1 fps for a pose snap or a b-roll clip with
   baked-in text.
4. **Multi-speaker formats (drama, dialogue, podcast, hot-seat, street interview,
   expert): unify voices before gate 3.** `tools/audio_check.py pick-ref` chooses a
   reference line per character; `tools/voice_unify.py` converts every trimmed line to
   it, levels loudness and builds a room-tone bed; each clip gets `"audio"` (its
   converted line) and `"speaker"`. Without `"speaker"` gate 3 cannot tell whether a
   character keeps one voice, and warns. For a scene, set `"tighten"` and name the
   beats in `"holds"`, then build the edit from `lines/unify-manifest.json` (its
   `in`/`seconds` include both). The pacing rules are in `formats/drama.md`.
   Then look at the final as a contact sheet: three frames per segment (head, middle,
   tail), with each caption checked against the face on screen.
5. **Gate 3: `node tools/qa.mjs final 06-finals/<format>/assemble.json
   --source-seconds <source runtime>`**, run from the folder `assemble.mjs` ran
   in. It fails a final that runs past its band (source × 1.35 and never past
   90 s, or the format module's declared band), a clip carved into 3+ pieces, a
   sub-1.2 s sliver cut from inside a take, a segment whose heard words do not
   match its script (the wrong line, or a clipped one), a line that plays twice,
   a music bed from outside the house `Soundtracks/` pool that is neither a
   `song.mjs` output nor licensed, and any spoken clip that fails the accent check. **Nothing
   goes into `DELIVERY.md`, `06-finals/` hand-off or `~/Downloads` without a
   PASS in `qa-final.json`.** A final that cannot pass is reported under "Not
   generated / needs a human call" with the gate's own reasons, not shipped.
6. Log one run-log line per final (clips, seconds, caption timing source, and
   the three gate verdicts).

Prompt-only runs skip this; hands-off runs do not — assembly is local and free,
so it is pre-committed. Faceless renders arrive already assembled; pass them
through only when the DNA needs a banner, end card or label they lack, with
`captions: false`. Full contract, cut rules and per-format defaults:
`references/edit-assembly.md`.

---

## Step 5 — assemble the delivery folder

Final state of `ad-remix-runs/<run-folder>/`:

```
STATUS.md              → state: DONE
status.json            → state: DONE, generator recorded, spend recorded
01-intake.md
02-persuasion-dna.md
03-rebuild.md           → the approved version (note any approval edits)
04-prompts/<format>.md  → one per built format
05-assets/<format>/     → generated stills + clips (empty if prompt-only)
06-finals/<format>/     → finished ads cut by the skill: assemble.json, <name>.mp4, manifest.json
run-log.md              → full audit trail
DELIVERY.md             → the summary the user reads first (below)
```

### DELIVERY.md template

```markdown
# Delivery — remix of [competitor ad] → [PRODUCT]

**Ran:** 2026-09-02  ·  **Generator:** Evolink (+ Adsora Gen for face UGC)  ·  **Spend:** $3.90 of $5.00 budget

## What was analyzed
[competitor ad] — [form received]. DNA: hook type [x], belief shift "[...]" → "[...]",
[N] beats. Full breakdown: 02-persuasion-dna.md.

## What was approved
Rebuilt script + [character] for [PRODUCT], approved 2026-09-02 with [N] edits.
Full script: 03-rebuild.md.

## What was generated
| Format | Stills | Clips | Assets |
|--------|--------|-------|--------|
| podcast-duo | 4 | 5 | 05-assets/podcast-duo/ |
| ugc-yapper  | 1 (ref) | 3 | 05-assets/ugc-yapper/ |
| whiteboard  | 6 | 6 | 05-assets/whiteboard/ |

Prompts for every format (built and un-built): 04-prompts/

## Finished ads
| Format | File | Length | Captions | Cut notes |
|--------|------|--------|----------|-----------|
| talking-head | 06-finals/talking-head/talking-head-final.mp4 | 42s | karaoke, whisper-timed | b-roll over clips 2–4, banner, no disclaimer |
| ugc-yapper   | 06-finals/ugc-yapper/ugc-yapper-final.mp4 | 43s | karaoke, whisper-timed | title card, no disclaimer |

Every ad above is cut, captioned and carded by the skill (tools/assemble.mjs).
No disclaimer line was burned into any of them.
Nothing is left for an editor. Raw clips stay in 05-assets/ for re-cuts; the
jobs files in 06-finals/ re-render any of them in seconds.

## Not generated / needs a human call
- [format] not built (user picked a subset).
- Clip 4 of podcast-duo: subdued line — needs an ElevenLabs key to regenerate;
  the assembly pass then swaps it in (`audio` on that clip).
- [NEED TO CONFIRM] items carried from Stage 3, if any.
```

---

## Step 6 — finalize

Set STATUS.md / `status.json` to `DONE`. Append the final run-log line, ending
`NOTIFY sent (RUN_DONE).`

**Push the `RUN_DONE` notification** via `PushNotification`:
`Remix "<slug>": done. <M> finished ads (<N> clips) in ad-remix-runs/<slug>/06-finals/.
Cost $<x>.` (Prompt-only run: `... prompts ready for <M> formats, no spend.`)
Record it in `status.json` `notifications[]`. If `PushNotification` is
unavailable, skip silently.

Give the user the DELIVERY.md summary and the folder path in chat (they'll see it
next time they open the conversation).

If a budget, auth, or content-filter issue stopped the run partway: state is
already `NEEDS_A_CALL` (set in Steps 2–3) with its notification sent. Record
exactly what completed and what is left so a later run resumes from `status.json`.
Do not also send `RUN_DONE`.
