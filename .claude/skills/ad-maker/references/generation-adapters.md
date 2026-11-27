# Generation Adapters — config, not hardcode

Stage 5 turns prompts into assets **through whatever generation backend is
configured**. Which one is used is configuration, never hardcoded.

- **Configured default: Evolink** — a plain HTTP API at
  `https://api.evolink.ai/v1`, authenticated with an `EVOLINK_API_KEY` in the
  local `.env`. Covers every image model and every third-party video model.
- **Face-to-camera UGC: Adsora Gen** — our own MiniMax H3 weights on our own
  RunPod GPU, driven by `tools/adsoragen.mjs` with keys from the skill's own
  `config/adsoragen.env`. Used automatically for the face UGC formats **when
  those keys and graphs are present**, and only then. See
  `references/adsoragen-video.md`.
- **Faceless VO + b-roll ads: `tools/faceless.mjs`** — rendered locally with
  Kokoro TTS (or a Chatterbox voice clone when a `refAudio` is supplied) and
  ffmpeg. No generation API at all, no per-clip cost. See
  `references/faceless-video.md`.
- **Also supported: a fal.ai-style adapter** — selectable via config.
- **Degrades to prompt-only** when nothing is connected.

---

## 1. The config file

`ad-maker/config/generators.json` (copy from
`generators.example.json`). If it is missing, the engine uses the same built-in
defaults: `default_adapter: "evolink"`.

```jsonc
{
  "default_adapter": "evolink",       // "evolink" | "adsoragen" | "fal" | "auto" | "prompt-only"
  "budget_usd": 5.00,                 // hard cap per run; quote before spending
  "quote_before_run": true,
  "draft_first": true,                // cheap drafts first, upscale approved winners
  "routing": {                        // per-format overrides on top of default_adapter
    "face_ugc_formats": ["ugc-yapper", "talking-head", "in-car-ugc", "ugc-tiktok-comment", "ugc-dialog"],
    "face_ugc_adapter": "adsoragen",  // used only when its keys are present
    "face_ugc_fallback": "evolink",
    "faceless_formats": ["faceless-vo-broll"],
    "faceless_tool": "tools/faceless.mjs",
    "vo_formats": ["moving-bg-vo-text"],          // voice spoken locally, picture assembled locally
    "vo_tool": "tools/faceless.mjs --vo-only",
    "text_first_formats": ["wall-of-text-music", "dance-big-text", "moving-bg-vo-text"],
    "card_tool": "tools/card.mjs"                   // flat graphics (comment bubble, headline, legal box)
  },
  "hands_off": { /* see references/pipeline-and-status.md §8 */ },
  "adapters": {
    "evolink":   { "kind": "evolink-style",   "...": "see generators.example.json" },
    "adsoragen": { "kind": "adsoragen-style", "...": "see generators.example.json" },
    "fal":       { "kind": "fal-style",       "...": "see generators.example.json" }
  }
}
```

---

## 2. Connecting Evolink (once)

There is no MCP, no OAuth, and nothing to click. Put the key in the `.env` of the
folder you run the skill from:

```bash
EVOLINK_API_KEY=sk-...
# optional; defaults to the line below if unset. Must end in /v1.
EVOLINK_BASE_URL=https://api.evolink.ai/v1
```

Media generation lives on `api.evolink.ai`. Evolink's text/chat host is
`direct.evolink.ai` — a **different** service, and not what this skill calls. A
media request sent to the text host 504s rather than failing cleanly, so if
generations hang, check the host before anything else.

The key is read from the environment at generation time. Never print it, never
copy it into a run folder, never write it into `status.json`.

---

## 3. Connecting Adsora Gen (optional, for face UGC)

Adsora Gen's keys live **inside the skill**, in `config/adsoragen.env` (copy
`config/adsoragen.env.example`), read by `tools/adsoragen.mjs` before the
process env, `./.env` and the house env files. `[SENSITIVE]` placeholders are
skipped at every level.

```bash
RUNPOD_API_KEY=rpa_...                    # required
RUNPOD_VIDEO_ENDPOINT_ID=7ud39rwzgljmtj   # required — the "adsora-gen" endpoint (US-NC-1)
# optional fallbacks, tried when the primary refuses a submit — a network volume
# is pinned to one datacenter, so a second endpoint is what keeps a run alive
# when one region has no free GPUs.
# RUNPOD_VIDEO_ENDPOINT_ID_2=
# RUNPOD_GPU_HOURLY=3.49  RUNPOD_S2V_STEPS=16  RUNPOD_VIDEO_STEPS=16
```

plus the four ComfyUI graphs the worker runs, in `config/adsoragen/`
(`h3-t2v.json`, `h3-i2v.json`, `h3-s2v.json`, optional `h3-s2v-chain.json`).
Every value exists in the Adsora webchat Vercel project; in the user's own
terminal, `vercel env pull` + `node tools/adsoragen.mjs --import-env <file>`
fills both the key file and the graph folder without a value passing through
chat. `node tools/adsoragen.mjs --health` then says what is set (never what it
is), which graphs exist and whether the endpoint has workers.

**If `--health` says `LIVE`, the face UGC formats route here.** If anything
required is missing, they fall back to `routing.face_ugc_fallback` (Evolink /
Seedance) and the cost quote says so in a line of its own. Never silently skip a
format because Adsora Gen is unconfigured, and never assume it is configured
because it was configured on some other machine.

Adsora Gen is used **by API only**: `tools/adsoragen.mjs` submits from this
machine to the RunPod endpoint, polls, and downloads every finished clip to the
run folder's `05-assets/<format>/` immediately. Never generate in the Adsora Gen
web app or a browser tab, and never leave a clip only on the server (hard rule
15). The filled key file stays in the installed copy; the distributable copy
ships the `.example` only. Full procedure: `references/adsoragen-video.md`.

---

## 4. Detection order

1. If `default_adapter` names a specific adapter, use it. If that adapter's
   credentials are not actually present, fall through to step 3.
2. `"auto"` → try each adapter in config order; the first whose `env_key` (and
   any other `required_env`) is set in the environment wins. Then try
   `cli_fallback` on PATH with its `env_key` set.
3. Nothing available → **prompt-only mode**. Announce it; never fail silently.

Then apply `routing` **per format**, on top of whatever step 1–3 resolved:

- a format in `face_ugc_formats` → `face_ugc_adapter` if
  `node tools/adsoragen.mjs --health` reports `LIVE` (keys in
  `config/adsoragen.env`, graphs in `config/adsoragen/`), else
  `face_ugc_fallback`;
- a format in `faceless_formats` → the local `faceless_tool`, not an API;
- a format in `vo_formats` → its voice through `vo_tool` (local), its single
  background clip (only if no house footage fits) through the resolved default
  adapter, its picture through `tools/assemble.mjs`;
- a format in `text_first_formats` → at most one still + one clip through the
  resolved default adapter (a face UGC format's rules apply if it is also in
  `face_ugc_formats`); the rest is `card_tool` + `tools/assemble.mjs`, local;
- everything else → the resolved default adapter.

Record the result in `status.json`:

```json
"generator": {
  "adapter": "evolink",
  "detected": true,
  "via": "env",
  "per_format": {
    "ugc-yapper": "adsoragen",
    "talking-head": "adsoragen",
    "podcast-duo": "adsoragen",
    "faceless-vo-broll": "tools/faceless.mjs",
    "moving-bg-vo-text": "tools/faceless.mjs --vo-only + evolink (1 clip) + tools/assemble.mjs",
    "wall-of-text-music": "local (tools/assemble.mjs)"
  }
}
```

---

## 5. The adapter contract

Whatever the adapter, Stage 5 only needs four operations:

| Operation | Inputs | Output |
|---|---|---|
| `generate_image` | prompt, optional reference image path(s), size/aspect, model | local image file path + reported cost (if any) |
| `generate_video` | prompt, optional start-frame image path, optional voiceover audio, duration, quality, native-audio flag, model | local video file path + reported cost (if any) |
| `get_cost_estimate` | model + params | estimated USD (round up; 0/unknown if it can't be known) |
| `report_actual_cost` | job result | actual USD if returned, else null |

### Evolink-style mapping

Both kinds are **async**: the POST returns `{ id, status, estimated_time }`
immediately, and you poll until it completes, then download the result URL.

```
POST /v1/images/generations   → { id }   poll: GET /v1/tasks/{id}
POST /v1/videos/generations   → { id }   poll: GET /v1/tasks/{id}
```

(`GET /v1/images/generations/{id}` also resolves an image task; `/v1/tasks/{id}`
is the one path that works for both, so prefer it.)

Model ids, by job:

| Job | Model |
|---|---|
| still, from scratch, or on-image headline text | `gpt-image-2` |
| still, from a reference image (character lock, product composite) | `gpt-image-2` with `image_urls` |
| still, hyper-real UGC | `nano-banana-2-beta` (Nano Banana Pro) |
| still, cheap draft | `nano-banana-2-lite` |
| clip, text-to-video | `seedance-2.0-fast-text-to-video` (best quality: drop `-fast-`) |
| clip, image-to-video | `seedance-2.0-fast-image-to-video` (best quality: drop `-fast-`) |
| clip, one take over 15s | `seedance-2.5-text-to-video` / `seedance-2.5-image-to-video` |
| **avatar clip (face to camera, 5–15s)** | **`seedance-2.0-image-to-video`** — full model, NOT `-fast-`, for avatar-led ads (talking-head, ugc-yapper, …). B-roll may stay `-fast-`. Voice = Chatterbox clone of the avatar's own audio, reused for all B-roll VO. Override only on explicit user instruction. See `references/formats/talking-head.md` → "AVATAR-LED AD DEFAULTS". |

**Field names are load-bearing. Evolink ignores unknown body keys instead of
rejecting them**, so a near-miss name is accepted, billed, and quietly wrong:

- aspect ratio is **`size`** on images and **`aspect_ratio`** on videos. Both
  take `"9:16" | "1:1" | "16:9"`. Sending `aspect_ratio` to the image endpoint is
  accepted and ignored, and every "9:16" still comes back in whatever shape the
  model chose.
- Seedance **2.5** image-driven directions accept exactly one value for
  `aspect_ratio`: `"adaptive"`. They take the shape from the reference image.
  Only the 2.5 *text*-to-video direction takes a real ratio.
- reference images → **`image_urls`** (array). Used for both image-to-video start
  frames and image-model consistency references.
- inpaint mask → **`mask_url`** (only with `image_urls`, only on `gpt-image-2`).
- a supplied voiceover → **`audio_urls`**, which also forces
  `generate_audio: true`.
- video also takes `duration` (seconds, 4–15) and `quality` (`"480p"` /
  `"720p"`).

**Brand words fail whole jobs.** Seedance moderation rejects the entire
generation for "copyrighted or trademarked content" when a prompt says iPhone,
GoPro, TikTok, Instagram, Reels, Snapchat, YouTube or Facebook. Scrub them to
neutral equivalents ("smartphone", "action camera", "vertical social video")
in what you *send*; keep the original text in the prompt file.

### Adsora Gen mapping (face UGC) — `tools/adsoragen.mjs`

Same four operations, different backend: RunPod serverless (`worker-comfyui`),
`{ input: { workflow, images } }` in, an mp4 out, job ids namespaced
`runpod:<endpointId>:<jobId>` so polling reaches the machine that took the work.
Not called by hand — write a jobs file and run the tool
(`tools/adsoragen.example.json` is the template):

```
node tools/adsoragen.mjs 05-assets/<format>/adsoragen.json --plan   # quote: frames, length, est. cost, blockers
node tools/adsoragen.mjs 05-assets/<format>/adsoragen.json          # generate; clips land in outDir
node tools/adsoragen.mjs --cancel runpod:<endpointId>:<jobId>      # if you stop waiting on one
```

| Job | `mode` | Model | Inputs |
|---|---|---|---|
| face clip lip-synced to a voice we made | `avatar` | `adsora-avatar-2.0` | `image` (reference portrait) + `audio` (WAV from `tools/faceless.mjs --vo-only`); length from the audio |
| clip from a start frame, H3's own audio | `i2v` | `adsora-gen-2.0-i2v` | `image` + `prompt` + `seconds` |
| clip from prose alone, H3's own audio | `t2v` | `adsora-gen-2.0` | `prompt` + `seconds` |

- **API only, saved locally.** The tool submits and polls from this machine and
  downloads each clip to `outDir` as it finishes; `adsoragen.results.json`
  carries job id, seed, `executionTime` and real cost per clip. The web app / a
  browser tab is never the generation path (hard rule 15).
- MiniMax H3 generates its **own synchronised stereo audio** and does
  **5.2–15.08 s** in one pass (frames on a 17k+5 grid at 24 fps; the tool
  snaps up). 480p is 480×832, 720p is 704×1280.
- `adsora-avatar-2.0` is the only model on either backend that lip-syncs to a
  voice track you supply. It **re-synthesizes** rather than passing the voice
  through, so the tool muxes your exact WAV back over H3's picture by default
  and keeps the raw output as `<name>.h3.mp4`. Make the voice first; ≤ 14.7 s
  (~44 words) per clip; `"chain": true` continues one shot across clips.
- The avatar prompt is **wrapped** by the tool (reference tags, single
  locked-off shot, lip-sync, clean frame) — your `prompt` is look and framing
  only.
- Cost is GPU time, not per clip: measured **≈ $0.11 for 5 s and ≈ $0.55 for
  15 s at 480p**, 720p about double, growing superlinearly — prefer several
  short clips to one long one wherever the edit allows. `--plan` estimates,
  `results.json` records the real figure (`executionTime × RUNPOD_GPU_HOURLY`).
- Jobs sit in *our* queue until a worker takes them. The tool cancels on
  timeout and on Ctrl-C; if you abandon one any other way, `--cancel` it — an
  uncancelled job eventually runs and bills for a clip nobody wants.

Full procedure, key file, graphs and troubleshooting: `references/adsoragen-video.md`.

### Faceless mapping

Not an API call at all. Write a jobs file and run
`node tools/faceless.mjs jobs.json`. Full procedure, setup, and the jobs-file
shape: `references/faceless-video.md`. `--vo-only` speaks the script and stops
(one WAV per job) for the formats that lay the voice under their own picture.

### Cards (flat graphics)

Also not an API call. `node tools/card.mjs cards.json` typesets a
reply-to-comment bubble, an iOS-Notes card, a headline block or a legal box as
a transparent PNG through the Chrome on the machine, for `overlays` in
`assemble.json`. No Chrome → the tool says so; use `text` blocks instead.

### fal.ai-style mapping

`endpoint` string + `arguments` object; returns a signed URL (download
immediately, URLs expire); local paths passed as `*_url`/`*_urls` auto-upload.
Endpoints are listed in `generators.example.json`.

---

## 6. Prompt-only mode (no adapter)

Not a failure. Deliver:
- every prompt from `04-prompts/`, unchanged, each in its own labelled
  copy-paste block;
- a "where to paste each one" note per format (which tool, which slot —
  start-frame vs reference-video, which resolution);
- the frame manifest and generation order so the user can run it by hand;
- the run log and status file finalized to `DONE` with
  `"generator": {"adapter": "prompt-only"}`.

The QUICKSTART example runs in this mode end to end.

---

## 7. Where assets land

All generated files download to the run folder in the working directory:
`ad-remix-runs/<YYYY-MM-DD>-<slug>/05-assets/<format>/`. Never leave an asset as a
remote URL — signed URLs expire.
