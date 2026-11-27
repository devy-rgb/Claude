# Adsora Gen — face UGC on our own GPU, from the skill

**Adsora Gen** is MiniMax H3 running on our own RunPod serverless endpoint
(`worker-comfyui` image, ComfyUI 0.31 booted from the network volume). One
model family covers three jobs: text-to-video, image-to-video from a start
frame, and a **talking avatar lip-synced to a voice we supply**. It generates
its own synchronised stereo audio and does up to **15.08 s in one pass**.

The skill drives it with **`tools/adsoragen.mjs`** — the same contract the
Adsora studio's own client uses (`webchat-vercel/lib/marketing/video/runpod.ts`,
`comfy-workflow.ts`, `avatar-video.ts`), reduced to a CLI. Everything runs **by
API from this machine** and every clip lands in the run folder as it finishes
(hard rule 15). The web app and the browser are never the generation path.

Formats routed here (`config/generators.json` → `routing.face_ugc_formats`):
`ugc-yapper`, `talking-head`, `in-car-ugc`, `ugc-tiktok-comment`, `ugc-dialog`,
and `podcast-duo`. The first fallback when it is not live is
`routing.face_ugc_fallback` (Evolink Seedance) — and the quote must say so in a
line of its own, never silently.

**Podcast / interview duo is the default Adsora Gen job too** (it used to go to
Seedance). Treat it as a two-person talking format: one **`i2v` clip per
speaker**, generated from that speaker's still (Frame B), with H3's own native
audio carrying the line — never the `avatar` mux, whose lip-sync drifts on a
long read. Alternate host/guest clips as the cut demands, keep one shared `seed`
per speaker so their look holds, and split any long single-speaker beat into a
chain (`references/talking-head-long-form.md`). Lock each speaker's own voice
descriptor in every one of their clips so the two never converge. Full format
rules: `references/formats/podcast-duo.md`.

---

## 1. Keys — `config/adsoragen.env`

The skill carries its own key file: **`config/adsoragen.env`**, read first by
the tool, before the process env, before `./.env` in the working folder, before
the house env files (`~/Documents/webchat-vercel/.env.local`,
`~/Documents/Adsora OS/.env`). A value that reads `[SENSITIVE]` is skipped at
every level — the webchat `.env.local` on this Mac is redacted that way, which
is why the skill needs its own copy.

| Variable | Required | What it is | Where it comes from |
|---|---|---|---|
| `RUNPOD_API_KEY` | **yes** | Bearer token for `api.runpod.ai` (starts `rpa_`) | RunPod console → Settings → API Keys, or the webchat Vercel project env |
| `RUNPOD_VIDEO_ENDPOINT_ID` | **yes** | The serverless endpoint running worker-comfyui + H3. House endpoint: **`7ud39rwzgljmtj`** ("adsora-gen", US-NC-1, network volume `q00nagvebo`) | RunPod console → Serverless → the endpoint page |
| `RUNPOD_VIDEO_ENDPOINT_ID_2`, `_3` | no | Fallback endpoints tried when the primary refuses a submit (5xx, 429, unreachable). `t5adchw32irgan` and `b497kbskl1yduu` answered `/health` on 2026-09-04 but their roles are unconfirmed | RunPod console |
| `RUNPOD_GPU_HOURLY` | no (3.49) | Turns RunPod's `executionTime` into the real dollars in `results.json`. Top of the pool assumed, since RunPod does not report which card ran | — |
| `RUNPOD_S2V_STEPS` / `RUNPOD_VIDEO_STEPS` | no (16 / 16) | Sampling steps for avatar / t2v+i2v jobs. Faces and fast motion soften when low | — |
| `RUNPOD_VIDEO_ETA_SEC` | no (150) | Cold-start ETA printed while waiting | — |

**Filling it, without the values ever passing through chat.** All of them live
in the Adsora webchat Vercel project (linked at `~/Documents/webchat-vercel`).
In the user's own terminal:

```bash
cd ~/Documents/webchat-vercel && vercel env pull /tmp/adsora-prod.env --environment=production
node ~/.claude/skills/ad-maker/tools/adsoragen.mjs --import-env /tmp/adsora-prod.env
rm /tmp/adsora-prod.env
node ~/.claude/skills/ad-maker/tools/adsoragen.mjs --health
```

`--import-env` copies the `RUNPOD_*` lines into `config/adsoragen.env` and the
four H3 graphs into `config/adsoragen/*.json`, printing names and lengths only.
Or paste by hand from the RunPod console into the file (`adsoragen.env.example`
is the template).

Rules that do not bend:
- The filled file lives in the **installed** copy (`~/.claude/skills/…`) only.
  The distributable copy in `~/Downloads` ships `adsoragen.env.example` and
  nothing else — a key in a shared folder is a leaked key.
- Never print a key, never copy one into a run folder, never write one into
  `status.json` or the run log. `--health` and the results file report *where*
  a key came from, never what it is.
- When the keys are missing the skill **says so** in the cost quote and falls
  back; it never assumes Adsora Gen is configured because it was on another
  machine, and never silently drops a face format.

---

## 2. Graphs — `config/adsoragen/*.json`

The worker runs a ComfyUI graph in "Export (API)" format — a map of node id →
`{ class_type, inputs }`. The graph is **data the tool substitutes into, never
code it writes**: a near-miss node name or input key does not error, it renders
the wrong thing and bills for it. So the four graphs are files:

| File | Env alternative | Job |
|---|---|---|
| `config/adsoragen/h3-t2v.json` | `ADSORA_WORKFLOW_H3_T2V` | text-to-video |
| `config/adsoragen/h3-i2v.json` | `ADSORA_WORKFLOW_H3_I2V` | image-to-video from a start frame |
| `config/adsoragen/h3-s2v.json` | `ADSORA_WORKFLOW_H3` | **avatar**: reference face + voice → lip-synced clip |
| `config/adsoragen/h3-s2v-chain.json` | `ADSORA_WORKFLOW_H3_CHAIN` | avatar clips 2..N, continuing the previous shot (optional; falls back to the s2v graph with a warning) |

Each graph carries placeholders the tool fills per job: `__ADSORA_PROMPT__`,
`__ADSORA_NEGATIVE__`, `__ADSORA_SEED__`, `__ADSORA_STEPS__`, `__ADSORA_WIDTH__`,
`__ADSORA_HEIGHT__`, `__ADSORA_FRAMES__`, and where the graph takes a file,
`__ADSORA_IMAGE__` (→ `adsora_ref.png`), `__ADSORA_AUDIO__` (→ `adsora_voice.wav`),
`__ADSORA_PREV__` (→ `adsora_prev.mp4`). Numeric slots are written unquoted so
ComfyUI sees ints. `--plan` builds every job's graph dry and lists an unfilled
or missing placeholder as a blocker **before** anything is spent.

Where the graphs come from: the webchat Vercel env (`--import-env` above), or a
fresh export from a running ComfyUI ≥ 0.31 with the H3 nodes
(`MiniMaxH3ReferenceToVideo`; autogrow inputs are dotted and zero-indexed —
`ref_images.ref_image_0` — while the prompt tags them `<Picture 1>`), ending in
**`SaveVideo`** (the boot script patches the worker to return video output;
the stock handler keeps only `images`). Replace the per-job values with the
placeholders and save the file. Do not author one from memory.

---

## 3. The jobs file and the three modes

`tools/adsoragen.example.json` is the template.

```jsonc
{
  "outDir":  "./ad-remix-runs/<slug>/05-assets/ugc-yapper",
  "aspect":  "9:16",          // 9:16 · 1:1 · 16:9
  "quality": "480p",          // 480p = 480×832 · 720p = 704×1280 (H3 snaps to /32)
  "seed":    20260905,        // shared by every job; chained clips MUST share one
  "accent":  "",              // only when the run names a non-American accent
  "chain":   true,            // run in order; each avatar clip continues the last shot
  "concurrency": 2,           // parallel lanes when not chaining (= max workers)
  "jobs": [
    { "name": "clip-1", "mode": "avatar", "image": "…/speaker-ref.png", "audio": "…/vo/clip-1.wav",
      "prompt": "phone-held selfie framing in a bright kitchen, natural hand gestures" },
    { "name": "broll-1", "mode": "i2v", "image": "…/frame-b.png", "prompt": "…", "seconds": 6 },
    { "name": "opener",  "mode": "t2v", "prompt": "…", "seconds": 5 }
  ]
}
```

| Mode | Model id | Inputs | Length | Audio |
|---|---|---|---|---|
| `avatar` | `adsora-avatar-2.0` | `image` (reference portrait) + `audio` (the voice) + optional `prompt` (look/framing only) | from the audio, ≤ 15.08 s | our exact voice, muxed back (see below) |
| `i2v` | `adsora-gen-2.0-i2v` | `image` (start frame) + `prompt` | `seconds` 5.2–15.08 | H3's own synchronised audio |
| `t2v` | `adsora-gen-2.0` | `prompt` | `seconds` 5.2–15.08 | H3's own synchronised audio |

`mode` may be omitted: audio present → avatar, image present → i2v, else t2v.
`model` works instead of `mode`. Per-job `seed`, `steps`, `quality`, `aspect`,
`accent`, `out` override the file-level values.

### Which mode — read this first

| You need | Mode |
|---|---|
| a face saying one line, ≤ ~35 words / ≤ 15 s | `t2v` (or `i2v` from a portrait when the look must match an existing clip) — picture + voice in one pass, native lip-sync, accent is a prompt line |
| the **same** face reading a whole script, > 15 s | **chained `i2v` with H3's own audio** — `references/talking-head-long-form.md`, run by `tools/talking-head-chain.sh` |
| the **exact** supplied voice track must survive (a clone, a client's VO) | `avatar` below — keep clips ≤ ~8 s; lip-sync softens with length |

`avatar` is **not** the default for talking faces. It animates the lips to H3's
internal re-synthesis of your track and then muxes the original back, so a long
read comes out visibly out of sync (measured 2026-09-05; the fix was rebuilding
the same script as chained `i2v`). Reach for it only when the voice itself is
the deliverable.

### The avatar flow — voice first, picture second, voice back on top

1. **Make the voice first.** One WAV per talking clip with
   `node tools/faceless.mjs vo.json --vo-only` (Kokoro preset or a Chatterbox
   clone via `refAudio`), or an ElevenLabs line. American accent unless the
   run says otherwise (hard rule 17). **One clip carries ≤ 14.7 s of speech
   (~44 words).** Split longer beats on sentence boundaries into several
   clips; never truncate mid-word. The tool refuses a voice over 15.08 s.
2. **The tool measures the WAV** (normalised to mono 24 kHz), snaps the frame
   count **up** to H3's 17k+5 grid so the clip is never shorter than the
   voice, and submits face + voice + the wrapped prompt.
3. **The prompt is wrapped for you.** H3 binds a reference only where the
   prompt mentions it (`<Picture 1>`, `<Audio 1>`, `<Video 1>`), and as a
   general video model it cuts to b-roll of the room after ~4 s unless the
   single locked-off shot is stated; it also burns garbled captions in
   unprompted. The wrapper adds the tags, the lip-sync instruction, the
   "no cuts, no b-roll" clause and the clean-frame clause. Your `prompt` is
   look and framing only — leave the tags out (the tool rejects them).
4. **Our voice goes back over H3's picture.** H3 *re-synthesizes* the audio it
   is given (loudness-envelope correlation ≈ 0.48 with the reference), so the
   default is to mux the exact WAV over the returned video (`-shortest` trims
   the grid tail). The raw model output is kept beside it as `<name>.h3.mp4`.
   `"keepModelAudio": true` keeps H3's track instead. **That 0.48 is the lip-sync trap:** the lips were
   animated to H3's re-synthesis, so muxing the original back desynchronises
   them, and the drift grows with clip length. A long read must therefore be a
   chain of `i2v` clips with native audio, not avatar — see "Which mode" above.
5. **Chaining** (`"chain": true`): jobs run in file order; each avatar clip
   after the first receives the previous clip's last ~1.8 s (picture only) as
   `<Video 1>` through the `h3-s2v-chain.json` graph, so framing, lighting and
   background continue across the join. All clips share the file's `seed` —
   letting each clip roll its own re-rolls the look at every cut. Without a
   chain graph the tool warns and uses the plain s2v graph; the joins then
   show a framing change (cover them with a b-roll cutaway in the edit).

Then the edit: `tools/assemble.mjs` cuts the clips, captions them from the
written script, adds the banner, cutaways and end card. Never the user.

---

## 4. Running it inside Stage 5

- **Step 1 (resolve the adapter):** `node tools/adsoragen.mjs --health`. It
  prints which keys are set and where from, which graphs exist (and the slots
  each carries), and each endpoint's workers/queue. `LIVE` → face UGC routes
  here; anything else → fall back to `face_ugc_fallback` and say so in the
  quote. Record `"per_format": {"ugc-yapper": "adsoragen", …}` in `status.json`.
- **Step 2 (quote):** write the jobs file into `05-assets/<format>/adsoragen.json`
  and run it with `--plan`. Paste its table into the cost quote — it shows
  frames, length and an estimated GPU cost per clip, plus every blocker. Add
  `--dump` to write the filled graphs into `.adsoragen-work/` for inspection.
- **Step 3 (generate):** run without `--plan`. Each clip is downloaded to
  `outDir` as it finishes; `adsoragen.results.json` beside the jobs file
  carries the job id (`runpod:<endpoint>:<id>`), seed, frames, executionTime,
  real cost and path per job. Copy one run-log line per clip from it. A
  timed-out job (25 min) is cancelled by the tool; Ctrl-C cancels everything
  in flight. If you stop waiting on a job for any other reason, cancel it:
  `node tools/adsoragen.mjs --cancel runpod:<endpoint>:<id>` — an abandoned
  job still runs and still bills.
- **Attended vs hands-off:** the same budget rules as every adapter. Real cost
  comes from `executionTime × RUNPOD_GPU_HOURLY`; the `--plan` estimate is
  what goes in the quote, the results file is what goes in the run log.
- Face-to-camera clips are **not** library footage; they stay in the run
  folder. Any i2v/t2v b-roll made here is copied into the matching
  `~/Documents/Adsora/Video Assets Raw/` niche folder like any other generated
  footage (hard rule 16).

---

### 4b. Generic chains — `tools/chain.sh`

`tools/talking-head-chain.sh` bakes in a realistic-skin spokesperson template. For anything else — a Pixar or
flat-2D narrator, a silent LEGO / cut-paper / whiteboard / low-poly action chain, a POV read — use
`tools/chain.sh --start still.png --prompts prompts.txt --secs 9.5 [--secs-file secs.txt] [--starts starts.txt] --seed N --workdir DIR --out final.mp4`:
one full prompt per line, each clip seeded from the previous clip's last settled frame (`--starts` restarts a
clip from a named still), one seed throughout, `-c copy` concat. Measured 2026-09-12: seven narrator clips
≈ $0.55, five silent 9.5 s clips ≈ $0.40. Companion helpers: `tools/heard.sh` (transcript + last-word end for
trims), `tools/words.sh` (word-level timings, for cutting lines out of a coverage take), `tools/speech-end.py`
(RMS speech start/end when the model pads a short line to its 5.2 s floor).

## 5. Cost

Measured 2026-08-10 on the house endpoint (BLACKWELL_96 pool, $3.49/hr):

| Job | Frames | Output | Exec | Cost |
|---|---|---|---|---|
| Avatar, face + our voice | 124 | 5.17 s, 480×832, h264 + AAC stereo | 118 s | $0.114 |
| Text-to-video | 124 | 5.17 s | 104 s | $0.101 |
| Avatar, 15 s | 362 | 15.08 s | 570 s | $0.553 |

Cost grows **worse than linearly** with length (3× the frames ≈ 5× the time).
`--plan` uses that fit: 5 s ≈ $0.11, 15 s ≈ $0.55 at 480p, 720p about double.
Prefer several short clips to one long one wherever the edit allows. Add ~60 s
of cold start to the first job of a sitting; the 90 s idle wind-down is real
money but shared by every clip in the same warm window, not charged per clip.

---

## 6. Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `--health` says `MISSING` | Fill `config/adsoragen.env` (§1). Both `RUNPOD_API_KEY` and `RUNPOD_VIDEO_ENDPOINT_ID` are needed; one alone does not count. |
| `RunPod 401/403: the API key was refused` | Wrong or revoked key. Check the RunPod console; re-pull from Vercel. |
| `graph … MISSING` / `still has __ADSORA_… after filling` | Graph file absent or missing a placeholder for something this job supplies (e.g. an i2v graph without `__ADSORA_IMAGE__`). Re-import or re-export the graph (§2). Never patch a node name by hand. |
| Job sits `IN_QUEUE` for many minutes | No free GPU in the pool or `workersMax` reached. `--health` shows `throttled`/`init`. Wait, or enable a fallback endpoint. Two people generating at once queue behind each other. |
| `finished but returned nothing` | The worker's handler patch did not apply: `/runpod-volume/runtime/boot.sh` must fold `videos`/`gifs`/`audio` into `images`. Check the endpoint's Container Start Command is `bash -c 'exec /runpod-volume/runtime/boot.sh'`. |
| `returned a non-mp4 … saved as .webp` | A legacy graph ending in `SaveAnimatedWEBP`. H3 graphs end in `SaveVideo`. |
| Presenter cuts away to the room mid-clip | The wrapper prevents this; if it still happens the `prompt` describes a scene. Keep it to look and framing. |
| Garbled subtitles burned into the frame | Same — the clean-frame clause is in the wrapper; do not add "with captions" to the prompt. Captions belong to the edit. |
| Voice sounds like a different person | The mux is off (`keepModelAudio: true`). Default it back on; H3 re-synthesizes the voice it is given. |
| Framing jumps between chained clips | No `h3-s2v-chain.json`, or the clips did not share a seed. Import the chain graph; pin one `seed` at file level. Cover remaining joins with a b-roll cutaway. |
| `the voice is 16.2s; H3 does at most 15.08s` | Split the line into two clips at a sentence boundary; keep `chain: true`. |
| Off-grid frame count rejected | The tool snaps to 17k+5 itself; if a hand-edited graph hard-codes `length`, restore the `__ADSORA_FRAMES__` placeholder. |
