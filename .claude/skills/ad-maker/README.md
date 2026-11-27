# Ad Maker

Installed as `ad-maker` (renamed on 2026-09-05 from `competitor-ad-remix-engine`,
then from `performance-creative-producer`). This installed copy carries the house overlay in
`references/house-defaults.md`; the generic, distributable copy keeps the old
name and does not. The description below is otherwise unchanged.

A standalone Claude Code skill. Give it a competitor's winning video ad; it
reverse-engineers the persuasion structure, rebuilds that structure around **your**
product, and turns the approved result into production-ready image/video prompts
for thirteen AI ad formats — then generates the assets if a generator is
configured, or hands back paste-ready prompts if not.

## Files

| File | What it is |
|---|---|
| `SKILL.md` | the skill definition, triggers, the 5-stage pipeline, hard rules |
| `SETUP.md` | step-by-step setup for someone who has never used Claude Code |
| `QUICKSTART.md` | one full worked run, start to finish, so you can see the output shape |
| `SELFTEST.md` | build-verification dry run (not loaded at runtime) |
| `references/` | stage procedures + cross-cutting craft + one module per format |
| `references/formats/` | 12 format modules (each links its full worked example) |
| `references/house-playbook.md` | the operator's real debugged process + a model-failure→fix troubleshooting log |
| `references/house-workflows/` | 11 real end-to-end ad production docs, folded in as training data |
| `references/faceless-video.md` | the faceless VO + b-roll render: setup, jobs file, failure table |
| `tools/faceless.mjs` | the faceless renderer itself — Kokoro TTS + ffmpeg, no build step |
| `tools/assemble.mjs` | the edit itself — cuts generated clips into finished ads (hard cuts, karaoke captions, banner, b-roll cutaways, end card; no disclaimer by house rule), ffmpeg only |
| `references/edit-assembly.md` | the assembly pass: what the skill cuts itself instead of handing to CapCut, and the jobs-file contract |
| `config/generators.example.json` | generator config; defaults to Evolink, editable |

Run folders are created in your **working directory** as `ad-remix-runs/<date>-<slug>/`.

## The pipeline

```
1 INTAKE → 2 ANALYZE → 3 REBUILD ─(hard approval gate)─→ 4 FAN OUT → 5 GENERATE & ASSEMBLE
```

Gated between every stage; hard stop for the user's approval after REBUILD, before
anything is spent. Progress is written to one `STATUS.md` / `status.json` per run
so it can be checked from a phone.

**Hands-off mode** ("remix this and run it hands-off") keeps only that one hard
stop: it pushes a phone notification when the script + avatar are ready, and after
a single "approved" it fans out and generates against a pre-set format list and
budget with no more prompts. Notifications fire at exactly three points —
script-ready, run-done, run-stalled. See `references/pipeline-and-status.md` §7–§8.

## Install

Copy this whole folder into `.claude/skills/` (project) or `~/.claude/skills/`
(global). See `SETUP.md`.

## Formats

podcast duo · talking-head / call-in · raw UGC yapper · 3D Pixar-style character ·
LEGO stop-motion · low-poly PS1 · paper-collage · whiteboard marker explainer
*(authored here)* · Simpsons-style flat 2D *(authored here)* · POV first-person ·
hot-seat crowd Q&A · expert caught in the moment · faceless VO + b-roll ·
street interview · in-car UGC · wall of text + music · dancing person + big
text callout · UGC reply-to-comment · UGC dialogue (two friends) · moving
background + VO + centred captions · cartoon music video *(authored here — an
original song generated locally, cut to animated visuals)*.

## Generators

| What | Where it runs | Turned on by |
|---|---|---|
| Everything by default — all stills, most clips | **Evolink** (`api.evolink.ai/v1`) | `EVOLINK_API_KEY` |
| Face-to-camera UGC (`ugc-yapper`, `talking-head`, `in-car-ugc`, `ugc-tiktok-comment`, `ugc-dialog`) | **Adsora Gen** — our MiniMax H3 weights on our own GPU, by API only via `tools/adsoragen.mjs`, every clip saved locally | `RUNPOD_API_KEY` + `RUNPOD_VIDEO_ENDPOINT_ID` in the skill's `config/adsoragen.env`, the H3 graphs in `config/adsoragen/` |
| Text-first ads (`wall-of-text-music`, `dance-big-text`, `moving-bg-vo-text`) — at most one clip generated; voice via `tools/faceless.mjs --vo-only`, graphics via `tools/card.mjs` | **locally**, then `tools/assemble.mjs` | `ffmpeg` (+ a Kokoro venv for the voice, Chrome for the cards) |
| Faceless VO + b-roll | **locally**, `tools/faceless.mjs` (Kokoro + ffmpeg) | `ffmpeg`, a Kokoro venv, `whisper-cpp` + a model in `~/.adsora/whisper/` |
| Music, songs & jingles (`cartoon-music-video`, or a bed when the pool has nothing) | **locally**, `tools/song.mjs` (ACE-Step) — no API, no per-track cost | a one-time ACE-Step install (`git clone … && uv sync`); see `SETUP.md` §3.4 |
| The edit — every format's finished MP4 | **locally**, `tools/assemble.mjs` (ffmpeg) — the skill cuts it, never the user | `ffmpeg` (+ `whisper-cpp` for word-timed captions, local, no key) |
| Nothing configured | prompt-only — every prompt handed back paste-ready | — |

Keys go in the `.env` of the folder you run from — except Adsora Gen's, which
live inside the skill at `config/adsoragen.env`. No MCP, no OAuth. A backend
that isn't configured falls back and says so in the cost quote; it never silently
drops a format. Details: `references/generation-adapters.md`.

Everything is generic by default — placeholders only. Your product details are
collected per run, never baked into the skill.
