# Model Specs — image & video generation

Consolidated, standalone technical reference for the models the format modules
target. Prices drift; treat any figure as "verify on the model's page before
quoting a real cost".

The sections below describe how to *prompt* each model. The ids you actually send
are in the table at the foot of this file — everything on the default path is
reached through Evolink, and the face UGC formats through Adsora Gen. See
`references/generation-adapters.md` for the request shapes.

---

## IMAGE MODELS

### Nanobanana Pro (hyper-real UGC stills — default for live-action formats)
- Every prompt starts with the literal words **"Hyper realistic"** (raises
  quality on this model).
- **Never** the word "iPhone" or any phone brand — it places a literal phone in
  the scene. Use "candid mobile camera quality — natural colour, mild
  compression, slight sharpening".
- No bokeh, no portrait mode: "Deep focus, no artificial blur" in every prompt.
- Everyday ambient light only. No studio / flash / ring light.
- Two-dial framework: **Subject Beauty** (Glam / Above-average / Average /
  Documentary) × **Image Polish** (Cinematic / Effortless-raw / Hyper-real-UGC /
  Low-fi). Set both, independently, on every prompt.
- Describe at 70% intensity — the model amplifies to 100%. "Natural skin
  texture", not "flawless" (→ plastic) and not "visible pores" (→ acne).
- CHARACTER LOCK line first inside the prompt from the 2nd image of a person
  onward; load image 1 as a Character Reference.
- Product-integrity block with exact label text whenever a product appears.
- 5–10 negatives max (more triggers ugly over-correction). End with "No phone
  visible anywhere in frame. No phone on the counter."
- Openers: `Hyper realistic candid UGC selfie ONLY (no bokeh, no portrait mode):`
  · `...mirror selfie ONLY...` · `...phone-propped shot ONLY...` ·
  `Hyper realistic product photo, phone-propped shot:`
- **Style-override mode:** for LEGO / paper / low-poly, most native rules invert
  (no skin realism, no "candid mobile camera quality" — it's a macro tabletop or
  craft shot). Keep only: "Hyper realistic" opener, CHARACTER LOCK discipline,
  deep-focus-not-fake-bokeh, name 2–3 real props, never draw the camera.

### GPT Image 2 (locked model for low-poly PS1; strong on-image text)
- **High Quality setting only** for the PS1 look — Low/Medium "clean up" the
  crunch. High or nothing.
- Best-in-class at rendering readable text baked into an image — the pick when the
  ad format needs a headline *in* the static.
- Reference-based edit endpoint takes one or more reference images + optional
  mask; from-scratch endpoint uses aspect-ratio presets.
- Describe the character byte-for-byte identically across every anchor still; only
  pose/scene slots change.

### Nano Banana / Nano Banana Pro (via fal.ai — fast composites)
- Cheap product-in-scene composites and brand-accurate scenes. Alternate to GPT
  Image 2 for reference-driven edits.

---

## VIDEO MODELS

### Kling 3.0 (best lip-sync + native clip chaining)
- Max clip ~10s hard cap. Sweet spot 6s / 13–17 words for lip-sync.
- Prompt = flowing director's prose, **no block headers inside**, 1200–2000
  characters. Over 2000 dilutes attention — cut visual description (the image
  locks it), keep performance / audio / negatives.
- Image-to-video primary. Native audio + lip-sync from the quoted dialogue.
  Outputs a usable Last Frame for chaining.
- Nine content blocks, authored in order, merged to prose: Shot Anchor → Opening
  Event → Main Action → State Constraints → Dialogue (quoted) → Performance →
  Audio (verbatim every clip) → Negatives (targeted) → Continuity (clips 2+ only).
- Open every prompt with `Realistic 9:16 [format].`
- Accent stated in 3 places per clip. No-word-echo strictly.
- Known limit: forces upbeat vocal delivery — plan audio replacement for subdued
  lines. Visual drowsiness cues work; audio ones don't.
- Always Pro / 1080p mode, never Standard.

### Google Omni / Gemini Omni 1.1 Flash (realistic talking-head + subdued VO + native audio; drives animation formats)
- Max ~10s per clip; 5–8s sweet spot; ~12–16 words per 6s.
- **Explicit labelled blocks beat one paragraph.** The 16-block brief order:
  Format → Quality/Fidelity Lock → Identity Lock (`@image1`) → Outfit Lock →
  Environment Lock → Scene → Background Objects → Camera → Camera Reveal Beat →
  Performance Vibe + per-line choreography → Voice → Dialogue (quoted) → Timing →
  Audio/Ambience → Style → Negative Constraints.
- Never remove/weaken: Fidelity Lock, Identity Lock, Camera block, Audio block,
  Negative Constraints. Only Character / Scene / Dialogue / Reveal / Props / Voice
  change per request.
- Camera does NOT move unless the beat explicitly orders it. Never write the word
  "cinematic". Default: locked-off phone, eye-level, one continuous take.
- **Performance Vibe** = one line naming the energy ("girl-gossip energy",
  "deadpan-dry", "soft-confessional"), then choreograph **per spoken line**
  (expression / gesture / pause; EMPHASIS word in CAPS; mark the setup→punchline
  pause).
- No cross-clip memory. Hold continuity by frame chaining + verbatim style/voice
  locks. Scene extension chains via `previous_interaction_id` in 10s increments up
  to 40s total. First/last-frame interpolation available. 360p draft → validate
  cheap → 1080p/4K upscale the winner.
- Native audio: split Dialogue / Ambient / SFX into their own statements.
- Handles subdued / soft vocal delivery (unlike Kling).

### Seedance 2.0 / 2.5 (UGC yapper + low-poly; up to 15–30s one-take, native audio)
- Up to 15s per generation (2.0) / 30s one-take (2.5). Native dual-channel audio
  (VO + foley) from prose.
- **Pure natural-language prose. No section headers, no bracket tags.** Weave
  who / setting+camera / action-over-time / dialogue (verbatim, keep the user's
  CAPS and ellipses) / sound / vibe into one flowing block.
- 2000-character ceiling per prompt block (2.0 yapper skill). Count it.
- References: plain `@Image 1`, `@Video 1`, `@Audio 1`; label each one's job
  ("@Image 1 defines the face, @Video 1 defines the camera move"). Unlabelled
  refs get blended. Reuse the exact same reference pack across every shot of a
  project for a consistent character.
- Every sentence must describe change over time — if a sentence could caption a
  still photo, rewrite it as motion.
- Always include an `audio:` direction ("no music" is valid). No separate
  negative field — bans go in a `constraints:` clause. Always
  `no readable text` unless on-screen text is wanted.
- Camera: name the exact move ("slow push-in", "handheld walking"); one shot, one
  move; compound moves = two timestamp blocks.
- No cross-clip memory — chain via video-reference (clip N as `@Video 1` for clip
  N+1, prompt opens with an extension line) or last-frame handoff.
- Render at 480p for drafts, 720p for finals. **For the low-poly PS1 look, render
  480p/720p only — never 1080p/4K; the low res sells the texture.**
- **Avatar clips use the full model, not `-fast-`.** For an avatar-led ad (a
  generated person delivering hook/CTA to camera), the on-camera **avatar clip**
  (5–15s) defaults to **`seedance-2.0-image-to-video`** — the face and lip-sync
  carry the ad. Silent **B-roll** clips may stay on `seedance-2.0-fast-image-to-video`
  to save cost. Override only on an explicit user instruction. See
  `references/formats/talking-head.md` → "AVATAR-LED AD DEFAULTS".

### Adsora Gen 2.0 / Adsora Avatar 2.0 (our own GPU — the face UGC path)
MiniMax H3 weights on our own RunPod endpoint, not a vendor. Driven by
`tools/adsoragen.mjs`; keys in the skill's own `config/adsoragen.env`, the
four ComfyUI graphs in `config/adsoragen/`. Used automatically for the face
UGC formats when `node tools/adsoragen.mjs --health` says `LIVE`. Full
procedure: `references/adsoragen-video.md`.
- **5.2–15.08 s in one pass** — frames on a 17k+5 grid at 24 fps (124–362),
  snapped up by the tool. 480p = 480×832, 720p = 704×1280 (multiples of 32).
  Generates its **own synchronised stereo audio** — no separate VO track for a
  normal clip.
- One model family covers three graphs: `adsora-gen-2.0` (text-to-video, mode
  `t2v`), `adsora-gen-2.0-i2v` (from a start frame, mode `i2v`),
  `adsora-avatar-2.0` (reference portrait + a supplied voiceover, lip-synced,
  mode `avatar`).
- `adsora-avatar-2.0` is the **only** model on either backend that lip-syncs to
  audio you provide. It re-synthesizes rather than passing the given voice
  through, so the tool muxes your exact WAV back over its picture by default
  (raw output kept as `<name>.h3.mp4`). Voice first — ≤ 14.7 s (~44 words) per
  clip — then the picture; `"chain": true` continues one shot across clips
  with a shared seed.
- The tool wraps every avatar prompt with the `<Picture 1>` / `<Audio 1>`
  reference tags, a single locked-off-shot instruction, the lip-sync clause and
  a clean-frame clause — H3 otherwise cuts to b-roll of the room after ~4 s and
  burns garbled captions in. Your prompt is look and framing only.
- Cost is GPU time: measured **≈ $0.11 for 5 s, ≈ $0.55 for 15 s at 480p**
  (720p about double), growing **superlinearly with length**. Prefer several
  short clips to one long one wherever the edit allows. Real cost per clip is
  `executionTime × RUNPOD_GPU_HOURLY`, written to `adsoragen.results.json`.
- Prompting for `t2v` / `i2v` follows the Seedance conventions above (flowing
  prose, motion in every sentence, audio direction inline). No motion presets.
- Jobs queue on our own endpoint: an abandoned job still runs and still bills.
  The tool cancels on timeout and Ctrl-C; `--cancel` anything else you stop
  waiting for.

### Kokoro TTS (or a Chatterbox clone) + ffmpeg (the faceless path — local, no model)
Not a generation model at all: `tools/faceless.mjs` speaks the script with a local
voice and cuts b-roll under it. Two engines, chosen per job: **Kokoro** by default
— 54 preset voices, no accent prompting (`af_*` American female, `am_*` American
male, `bf_*`/`bm_*` British) — or, when a job/config supplies a `refAudio` (a clean
~7–12s WAV), **Chatterbox** clones that exact voice zero-shot. Cloning fires only
where a `refAudio` is present. Zero per-clip cost, caption timing included
(local whisper.cpp, no key). `--vo-only` speaks the script and stops (one
WAV per job) for formats that put the voice under their own picture.
Full spec: `references/faceless-video.md`.

### ACE-Step 1.5 (the song maker — local, no API, the music/jingle path)
Not a video model: `tools/song.mjs` generates a full **song with vocals**, a
**jingle**, or an **instrumental bed** on this machine with ACE-Step 1.5 (MLX on
Apple Silicon; CUDA/CPU elsewhere). No web UI, no key, no per-track cost (GPU
time only), fully offline after a one-time ~10GB model download. The output is
original and locally generated, so it is **yours to use** — it clears the house
no-unlicensed-music rule (`references/edit-assembly.md` §9).
- **Inputs:** a `caption` (comma-separated style brief: genre, vocal type,
  instruments, energy) + `lyrics` (verbatim, with `[Verse]`/`[Chorus]` tags), or
  `instrumental: true` for a bed, or a one-line `sampleQuery` to have the model
  write the lyrics. Optional `duration` (s), `bpm`, `keyscale`, `seed`
  (reproducible).
- **Models:** turbo DiT + a 5Hz LM (`0.6B` light / `1.7B` recommended / `4B` max,
  needs ~24GB). Set per jobs file with `lmModel`.
- **Speed/cost:** ~1–2 min per 30–45s track on an M-series Mac; $0.00.
- **Used by:** the **cartoon music video** ad (the song is the ad) and as a
  fallback bed when the `Soundtracks/` pool has nothing that fits (hard rule 20).
- **Headless:** runs unattended (writes `thinking=false`, feeds `/dev/null`); it
  never opens the ACE-Step UI. Setup + full spec: `references/song-maker.md`.

### tools/card.mjs (flat graphics — no model)
A reply-to-comment bubble, an iOS-Notes card, a headline block or a legal box,
typeset as HTML/CSS and screenshotted to a transparent PNG by the machine's
Chrome, then laid over the ad as an `overlays` entry in `assemble.json`. Video
models garble printed text; this never does. Without Chrome the tool exits and
says so — approximate the graphic with `text` blocks instead.
- **Faceless ads use the house preset: `am_adam` at 1.1 (`af_sarah` at 1.2).**
  There is no avatar clip to clone from, so nothing is cloned unless the user
  supplies a `refAudio`. Measured, not aesthetic: those speeds land the read at
  ~185 wpm, the direct-response band (`references/house-defaults.md` §1).
- **Avatar-led ads default to a Chatterbox clone of the avatar's own voice.** Take
  the `seedance-2.0` avatar clip's native audio, isolate the voice
  (Demucs `--two-stems=vocals` → mono 24 kHz) as the `refAudio`, and clone it with
  Chatterbox for all B-roll VO — one voice across the whole ad, matching the
  on-screen avatar. Kokoro preset is the fallback only when there is no avatar
  audio to clone. Never clone a real person's voice from the source ad.

### ElevenLabs (VO repair path — all formats)
When a native model mangles the voiceover: transcribe → regenerate the line in
ElevenLabs with emotion tags → in the assembly pass (`audio` on that clip in
`assemble.json`, `ambience` to keep the room tone), strip the broken generated
voice and lay the clean track over the ambience. The skill does this swap. Optional
bit-crush to match degraded visuals.

---

## PICK-A-MODEL QUICK TABLE

| Need | Use |
|---|---|
| Best lip-sync fidelity, clip-to-clip continuity | Kling 3.0 |
| Realistic talking head with subdued / soft delivery | Google Omni |
| Native audio + long one-take + raw UGC feel | Seedance 2.0 |
| Animation formats (LEGO / paper / whiteboard / 2D character) needing native VO | Google Omni |
| Low-poly PS1 motion obedience | Seedance 2.0 @ 480–720p (stills: GPT Image 2 High) |
| Hyper-real stills for live-action | Nanobanana Pro |
| On-image headline text in a static | GPT Image 2 |
| A face talking to camera, at our own cost | Adsora Avatar 2.0 — `tools/adsoragen.mjs` mode `avatar`: portrait + the voice made first |
| A face lip-syncing to a voiceover we already have | the same — `adsora-avatar-2.0`, the WAV as `audio`; our voice goes back over the picture |
| Voiceover over b-roll, no face, at volume | `tools/faceless.mjs` (local; house Kokoro preset `am_adam` 1.1 / `af_sarah` 1.2, or Chatterbox clone via `refAudio`) |
| One continuous shot under a voice, captions centred | `tools/faceless.mjs --vo-only` + one house/Seedance 2.5 shot + `tools/assemble.mjs` |
| Story copy or a big claim on screen, music, no voice | no model — a house clip + `tools/assemble.mjs` `text` / `tools/card.mjs` |
| An original song, jingle, or a bespoke bed (music-video ad, or a bed when the pool has nothing) | `tools/song.mjs` (ACE-Step, local; free; `references/song-maker.md`) |
| Pixel-perfect on-screen graphic (comment bubble, headline, legal box) | `tools/card.mjs` (headless Chrome → PNG overlay) |

---

## MODEL IDS — what to actually send

**Evolink** (`https://api.evolink.ai/v1`, `EVOLINK_API_KEY`):

| Job | Model id |
|---|---|
| Still from scratch, or on-image headline text | `gpt-image-2` |
| Still from a reference (character lock, product composite) | `gpt-image-2` + `image_urls` |
| Hyper-real UGC still | `nano-banana-2-beta` |
| Cheap draft still | `nano-banana-2-lite` |
| Clip, text-to-video | `seedance-2.0-fast-text-to-video` (quality: drop `-fast-`) |
| Clip, image-to-video | `seedance-2.0-fast-image-to-video` (quality: drop `-fast-`) |
| One take over 15s | `seedance-2.5-text-to-video` / `seedance-2.5-image-to-video` |

Seedance **2.5** image-driven directions take `aspect_ratio: "adaptive"` and
nothing else — they inherit the shape from the reference image.

**Adsora Gen** (RunPod via `tools/adsoragen.mjs`; keys in `config/adsoragen.env`):

| Job | Model id | jobs-file `mode` |
|---|---|---|
| Face clip from a prompt | `adsora-gen-2.0` | `t2v` |
| Face clip from a start-frame portrait | `adsora-gen-2.0-i2v` | `i2v` |
| Face clip lip-synced to a supplied voiceover | `adsora-avatar-2.0` | `avatar` |
