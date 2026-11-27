# Stage 4 — FAN OUT TO FORMATS

**Goal:** take the *approved* script + character from `03-rebuild.md` and produce
production-ready prompts in every format the user picks. One file per format in
`04-prompts/`.

**Precondition:** `status.json` shows the REBUILD → FAN OUT gate was crossed with
an explicit user approval. If not, go back to Stage 3.

---

## Step 1 — pick the formats

**Hands-off mode:** skip this — use `status.json` `formats_selected` captured at
INTAKE. Do not ask. Go straight to Step 2.

**Attended mode:** show the user the menu and let them choose "all" or a subset:

| # | Format | Module | Engine stack |
|---|---|---|---|
| 1 | Podcast / interview / two-character broadcast | `formats/podcast-duo.md` | image model stills → **Adsora Gen `i2v` per speaker** when configured (Evolink Seedance / Kling / Omni as the fallback) |
| 2 | Talking-head / call-in advice show | `formats/talking-head.md` | Nanobanana stills → Omni or Kling |
| 3 | Raw UGC yapper / selfie rant | `formats/ugc-yapper.md` | Seedance 2.0 prose, or Nanobanana → Omni + green screen |
| 4 | 3D Pixar-style character / Pixar street interview | `formats/pixar-3d-character.md` | image model → Kling i2v (talking) / Nanobanana → Omni (scene) |
| 5 | LEGO stop-motion | `formats/lego-stop-motion.md` | Nanobanana (style-override) → Omni |
| 6 | Low-poly / PS1-era animated | `formats/low-poly-ps1.md` | GPT Image 2 High → Seedance 2.0 @ 480–720p |
| 7 | Paper-collage stop-motion | `formats/paper-collage.md` | GPT Image 2 / image model → Omni |
| 8 | Whiteboard / marker explainer | `formats/whiteboard-marker-explainer.md` | GPT Image 2 stills → Seedance 2.5 (visible actor) / Omni (hand-only) |
| 9 | Simpsons-style / flat 2D animated | `formats/simpsons-flat-2d.md` | image model (2D model sheet) → Kling/Omni image-to-video |
| 10 | POV / first-person scene | `formats/pov-first-person.md` | Nanobanana start/end frames → Omni (first/last-frame interpolation) |
| 11 | Hot-seat / crowd Q&A (live-event social proof) | `formats/hot-seat-crowd-qa.md` | Nanobanana anchors → Omni 16-block |
| 12 | Expert caught in the moment (third-party recommendation) | `formats/expert-caught-in-moment.md` | Nanobanana stills (+ GPT Image 2 recreations) → Omni |
| 13 | Faceless VO + b-roll (no person on screen) | `formats/faceless-vo-broll.md` | local render — `tools/faceless.mjs` (Kokoro TTS, or Chatterbox clone via `refAudio`; + ffmpeg), no model |
| 14 | Street interview / vox-pop (live-action) | `formats/street-interview.md` | Nanobanana anchors → Omni 16-block (or Seedance i2v) |
| 15 | In-car UGC (parked-car confessional) | `formats/in-car-ugc.md` | Seedance 2.0 prose → Adsora Gen when configured |
| 16 | Wall of text + music (no voice, no face) | `formats/wall-of-text-music.md` | one house clip (or one Seedance clip) + `tools/assemble.mjs` text |
| 17 | Dancing person + big text callout (no voice) | `formats/dance-big-text.md` | Nanobanana still → one Seedance i2v clip; `tools/card.mjs` headline + `tools/assemble.mjs` |
| 18 | UGC reply-to-comment (bubble + half-frame proof) | `formats/ugc-tiktok-comment.md` | yapper stack → Adsora Gen when configured; `tools/card.mjs` bubble; `region: "bottom"` inserts |
| 19 | UGC dialogue (two friends, shot / reverse shot) | `formats/ugc-dialog.md` | Seedance prose per character → Adsora Gen when configured (or Nanobanana → Omni) |
| 20 | Moving background + VO + centred captions (one shot) | `formats/moving-bg-vo-text.md` | `tools/faceless.mjs --vo-only` voice + one house/Seedance 2.5 shot + `tools/assemble.mjs` |
| 21 | Cartoon music video (the song IS the ad) | `formats/cartoon-music-video.md` | **`tools/song.mjs`** for the original song (local, ACE-Step) → cartoon stills → Kling/Omni/Seedance i2v shots cut to the beat + `tools/assemble.mjs` |
| 22 | Narrated funnel walkthrough (the form is the proof) | `formats/funnel-walkthrough.md` | **captured, not generated** — a phone filming the funnel on a laptop screen + house b-roll for the cold-open + `tools/assemble.mjs` |
| 23 | Drama (scripted conflict scene; variant A cinematic, variant B caught on a phone) | `formats/drama.md` | **Seedance, not Adsora Gen** — Nanobanana / GPT Image 2 start stills → **`seedance-2.0-image-to-video`** coverage takes (one speaking face per take, 8–15s) cut into 2–3s shots with `in` / `out`; `-fast-` for silent inserts; **`seedance-2.5-image-to-video`** only for a variant B one-take over 15s; document props as stills; variant B phone screens **captured**; `tools/assemble.mjs` with plain film subtitles |
| 24 | Walking-and-talking (camera moves with the speaker; ROUTE LOCK holds the background across a long chained video) | `formats/walk-and-talk.md` | Nanobanana waypoint stills → Omni first/last-frame interpolation per leg, or **Adsora Gen chained `i2v`** per hard rule 19 when configured |
| 25 | Voiceover + customer POV story (first-person confessional VO over bespoke first-person POV b-roll, no face) | `formats/customer-pov-story.md` | Nanobanana/GPT Image stills → Omni/Seedance silent POV clips (generated, not stock) → `tools/faceless.mjs` for VO + captions + assembly |

Record the selection in `status.json` (`formats_selected`).

**No format writes on-screen text.** The approved script has no caption line and
neither does your output: subtitles are burned from the spoken audio in the
assembly pass, always, in the house spec (hard rule 23,
`references/production-discipline.md` §13). Every still and video prompt still
carries its "no subtitles, no captions, no on-screen text, no logos" negative,
because the picture must come back clean. What you *do* still specify per format
is any designed graphic the ad needs, in the assembly note: banner lines, an end
card, a product label, a comment bubble, a before/after label. The four
text-first formats below are the exception, and only because the type is the
ad.

**Format 22 produces no model prompts at all.** It is captured, not generated:
its Stage 4 output is a narration script, a capture sheet (URL, the exact answers
to type, the device), a b-roll brief for the cold-open, and the jobs file. None
of the character / identity / outfit / gaze lock vocabulary applies, because
there is no generated performer — see its module. Formats 22 and 23 are the two formats
*expected* to run long — 60–190s and 90–200s — rather than the usual 20–45s band.

**Format 23 (drama) is take-plan and shot-list driven.** Seedance clips run
4–15s, so the 2–3s drama rhythm is never generated shot by shot: Stage 4 writes
a **take plan** (one camera angle and one speaking face per Seedance take, lines
separated by mouth-closed listening pauses) and a **shot list** that cuts every
shot out of a take with `in` / `out`. Plus a reference pack, a cast sheet cast by
persuasion role (hero / skeptic / authority / bystander) and a set sheet. Its
module carries a reference skeleton to copy when there is no competitor
transcript. It keeps subtitles on but in the plain film style (`style: "plain"`,
`uppercase: false`), not the house karaoke card — see its module.

**Four more formats produce few or no model prompts.** Format 13 is rendered
locally and its Stage 4 output is a script, a b-roll brief and a jobs file — see
its module. Formats 16, 17 and 20 are *text-first*: their Stage 4 output is the
on-screen text (or the spoken script), a one-shot background brief, at most one
still + one clip prompt, and the ready-to-run `cards.json` / `vo.json` /
`assemble.json` files — the finished ad is the assembly pass. Formats 1, 2, 3, 15,
18 and 19 (the face UGC formats — the podcast/interview duo now among them)
still produce normal prompts, but Stage 5 routes them to Adsora Gen instead of
Evolink Seedance when its keys are present locally; that changes the engine, not
what you write here. See `references/generation-adapters.md` §3–§4 and, for the
podcast (two speakers, `i2v` per speaker), `references/adsoragen-video.md`.

**Format 21 (cartoon music video) is a hybrid:** its Stage 4 output is a
**song jobs file** (`05-assets/song/song.json` — lyrics in song structure, the
approved beats mapped to intro/verse/chorus) *plus* normal cartoon image/clip
prompts. Generate and approve the song first in Stage 5 (a re-roll is cheap and
every shot cuts to it), then the visuals. See `references/formats/cartoon-music-video.md`
and `references/song-maker.md`.

**Format 25 (customer POV story) is also a hybrid:** its Stage 4 output is
normal silent POV image/clip prompts (no dialogue, no face) *plus* a
first-person voiceover script and a `faceless.mjs` jobs file exactly like
Format 13, pointed at this run's generated clips instead of stock. Generate the
POV clips first, screen them into a pool (`tools/broll-pool.mjs`), then render
the VO pass. See `references/formats/customer-pov-story.md`.

**Format 24 (walking-and-talking) is expected to run long** whenever it's built
as a multi-leg walk — plan the full ROUTE LOCK waypoint list before generating
anything (`references/formats/walk-and-talk.md` §1); a single-leg walk under
15s can skip straight to a normal one-clip build.

**Note on variants:** several modules carry sub-variants (call-in advice show
inside talking-head; two-character broadcast inside podcast-duo; green-screen +
Omni inside yapper; Pixar street interview inside pixar-3d-character; hand-only /
Pixar-pointer / blackboard-chalk inside whiteboard; single-respondent /
montage / interviewer-answers inside street-interview; dash-mount / handheld /
passenger-seat inside in-car-ugc). The module's own "House
workflow" section explains when to reach for each. If the competitor ad clearly
maps to a variant, build that variant and say so.

---

## Step 2 — for each chosen format

1. **Read the format module** in full plus `references/production-discipline.md`
   and the relevant sections of `references/model-specs.md`.
2. **Segment the approved script into clips** for that format's engine and clip
   caps (do not re-cut the persuasion beats — split within them for length).
3. **Build the frame manifest** — every start-frame the sequence needs, in
   generation order, flagged NEW (full describe) vs LOCK (continuation of an
   earlier frame). Reuse anchors; don't spawn frames you don't need.
4. **Write the image prompts** in manifest order, applying that format's still
   rules and the character/product locks.
5. **Write the clip prompts** in cut order, applying that format's motion rules,
   the shared discipline (one action per clip, no-word-echo, accent lock,
   verbatim audio block, targeted negatives, continuity blocks), and the
   dialogue verbatim from the approved script.
6. **Write the assembly note** — generation order, which clips are continuations,
   where a B-roll cutaway covers a position jump, where captions/labels get
   composited in post, any clip whose audio needs replacing in edit. This note
   is the spec for Stage 5's assembly pass, which the skill runs itself with
   `tools/assemble.mjs` — write it as instructions to that tool (clip order,
   cutaway timings, banner / end-card text, `"disclosure": false`), never as a CapCut
   to-do list for the user.

Write it all to `04-prompts/<format>.md` with this shape:

```markdown
# <Format> — prompts for [PRODUCT]

Engine: <stack>  ·  Aspect: 9:16  ·  Source script: 03-rebuild.md (approved <date>)

## Frame manifest
Frame A — [who/what] — NEW (anchor) — used by Clip 1, 3
Frame B — [who/what] — LOCK to A — used by Clip 2
...
Generate in order: A, B, C ...

## Image prompts
### Frame A — NEW
[paste-ready image prompt]
### Frame B — LOCK to A
[paste-ready image prompt]
...

## Clip prompts
### Clip 1 — [beat] — ~[X]s — starts from Frame A
[paste-ready clip prompt]
### Clip 2 — [beat] — ~[X]s — starts from Frame B — continuation
[paste-ready clip prompt]
...

## Assembly
1. Generate stills A→B→C in <image model>.
2. Animate Clip 1 from Frame A; Clip 2 continues from Clip 1's last frame.
3. [B-roll cutaway covers the jump between Clip 3 and Clip 4.]
4. Composite: [product label onto Frame C's clean face / burn VO captions centered].
5. Timeline: Clip 1 → Clip 2 → ...
6. [Clip 4 audio is subdued — replace via ElevenLabs.]
```

---

## Step 3 — cross-format consistency

- **Same script, same beats, same dialogue** across every format. Only the
  delivery style changes.
- **Same character identity** where the format allows a person (podcast,
  talking-head, yapper) — reuse the anchor description from `03-rebuild.md`.
- **Same product treatment** — locked silhouette/colours everywhere; label text
  held out of generation and composited in post unless a product image was
  uploaded to lock against.
- **Same hook** — use hook #1 from the approved script as the built hook, and
  note the other four as swap-in alternates for testing (each format's Clip 1 is
  the only thing that changes to test them).

---

## Step 4 — lint every jobs file before handing off

Stage 4 is where the prompts get written, so it is where British vocabulary, a
missing US region or a four-line take gets caught for free. Write each format's
jobs file(s) alongside its prompt file and run `node tools/qa.mjs lint` on them.
Fix every FAIL in the prompt file *and* the jobs file before showing the user.
The prompt files the user reviews must be the ones that pass.

---

## Handoff

Write every `04-prompts/<format>.md`, append the run-log line listing which
formats were built.

- **Attended mode:** update STATUS.md / `status.json` to `WAITING_REVIEW`. Show
  the prompt files and ask:
  > Prompts are ready for [formats]. Generate the assets now (I'll quote the cost
  > first), or hand these back for you to paste yourself?
- **Hands-off mode:** do not ask. If `auto_generate` is true, proceed straight to
  Stage 5. If `auto_generate` is false, finalize as a prompt-only delivery (skip
  Stage 5 generation, still write `DELIVERY.md` + push `RUN_DONE`).
