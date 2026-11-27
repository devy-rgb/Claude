# Faceless video — local render, no generation API

The faceless format is a voiceover over stock b-roll with word-timed captions and
a music bed. There is no person on screen and nothing to lip-sync, so there is
nothing an expensive video model does here that ffmpeg does not do better,
cheaper, and identically on every rerun.

So this format does **not** go through Evolink or Adsora Gen. It is rendered
locally by **`tools/faceless.mjs`**, which ships inside this skill.

Script in, finished vertical ad out. For each job it speaks the script with a
local Kokoro voice, works out when every word is said, picks and packs b-roll
under it, burns word-timed captions, lays a music bed, and writes an MP4.

---

## 1. Setup (once per machine)

```bash
brew install espeak-ng ffmpeg uv
uv venv --python 3.11 ~/.adsora/kokoro
uv pip install --python ~/.adsora/kokoro/bin/python kokoro soundfile
VIRTUAL_ENV=~/.adsora/kokoro ~/.adsora/kokoro/bin/python -m spacy download en_core_web_sm
brew install whisper-cpp       # caption timing, local and free
mkdir -p ~/.adsora/whisper && curl -L -o ~/.adsora/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

**Put the venv somewhere durable.** `~/.adsora/kokoro` is the house path. A venv
under a temp or scratchpad directory is wiped on reboot and takes every future
render with it, silently, at the next run.

`faceless.mjs` falls back to `~/.adsora/kokoro/bin/python` (the house path above)
when a jobs file omits `python`. Always set `python` explicitly anyway — every
template here does.

**If Kokoro is not installed, `faceless.mjs` stops before it renders anything**
and prints the four install commands above (with the exact venv path it looked
for). This preflight only fires for jobs that actually use Kokoro — the default
engine, i.e. any job with no `refAudio`. So on a fresh machine you get the setup
steps up front instead of a run that dies job-by-job with "no audio". A job that
sets `refAudio` clones through Chatterbox and does not need this venv at all.

Three of those are not preferences:

- **Python 3.11.** Kokoro pulls spacy → thinc → blis, which publishes no wheels
  for 3.13 and fails trying to compile.
- **espeak-ng from homebrew.** The `espeakng_loader` wheel bundles its own espeak
  data, but espeak cannot load it on macOS — it reports a missing phontab, and
  Kokoro then produces **no audio while still exiting zero**. The script repoints
  the loader at the homebrew tree before misaki imports, which is the only moment
  that patch can take.

Word-level timings for the captions come from local whisper.cpp
(`tools/captions.mjs`: `heardWords`, model in `~/.adsora/whisper/`). Nothing in
this path is metered; the tool refuses to start without `whisper-cli` and a
model unless it is run `--vo-only`.

---

## 2. Run it

```bash
node tools/faceless.mjs jobs.json
```

`tools/faceless.example.json` is a working template. The shape:

```jsonc
{
  "outDir":      "./ad-remix-runs/<slug>/05-assets/faceless-vo-broll",
  "brollDir":    "~/Documents/Adsora/Video Assets Raw/B-Roll/<NICHE>",        // house library first (hard rule 16); any folder of mp4/mov
  "brollPool":   "./ad-remix-runs/<slug>/broll-pool.json",   // the screened survivors (§2a); beats the raw folder
  "hooksDir":    "~/Documents/Adsora/Video Assets Raw/Visual hooks/<NICHE>",  // optional opener clips
  "musicDir":    "/absolute/path/to/music",   // optional; rotates across jobs
  "voice":       "am_adam",                   // house read; af_sarah for female. Used when NOT cloning
  "speed":       1.1,                         // am_adam 1.1 / af_sarah 1.2 land ~185 wpm; omit and the house speed for the voice applies
  "refAudio":    "/abs/path/voice-ref.wav",   // optional: clone THIS voice (Chatterbox)
  "voiceEngine": "kokoro",                     // optional; auto → chatterbox when refAudio set
  "musicVolume": 0.06,                        // linear gain under the voice
  "transitions": ["fade","dissolve"],         // optional: the crossfade rotation. Default also carries "fadeblack", a dip to black
                                              // that blackdetect flags as a 0.13s black flash; drop it for a fast direct-response read
  "wordsPerCue": 3,                           // caption words per cue; 2 when the script has long words (a 3-word cue past ~20 characters clips at the frame edge)
  "maxWords":    3,                           // caption cards: at most 3 words and 16 characters (house spec, tools/captions.mjs) …
  "maxChars":    16,                          // … a new card at any pause over 0.45s ("pauseBreak") or a sentence end
  "captionSize": 58,                          // caption font size at 720x1280; the face is Gotham Black when installed
  "aspect":      "9:16",                      // or "1:1" / "16:9"
  "python":      "~/.adsora/kokoro/bin/python",              // Kokoro venv
  "chatterboxPython": "~/.adsora/vc-chatterbox/bin/python",  // clone venv
  "jobs": [ { "name": "ad-01", "script": "...", "hook": "opener.mp4",
             "refAudio": "/abs/path/spokesperson.wav" } ]  // per-job ref beats the global one
}
```

It writes one MP4 per job into `outDir`, plus a `manifest.json` recording which
jobs rendered and which failed. A failed job does not stop the others.

A job may carry its own `voice` / `speed` (a female read for one hook variant
in a batch of male reads); anything unset falls back to the config level.

### 2a. Voice only

```bash
node tools/faceless.mjs vo.json --vo-only
```

Speaks every job and stops: `outDir/<name>.wav` per job, `manifest.json` with
`voSec`, no b-roll, no captions, no whisper needed. This is the voice for the
formats that supply their own picture — `moving-bg-vo-text` lays the WAV under
one continuous shot with `tools/assemble.mjs` (`audio` + `script` on a looped
clip), and any format can use it for a narrated still or an end-card read.
`brollDir` may be omitted in a voice-only jobs file.

---

## 2a. Screen the b-roll before the first render

The renderer draws from whatever `brollDir` holds. A clip with baked-in text,
a watermark, a "SUBSCRIBE" overlay or a competitor's logo will end up under
the voice sooner or later, so the folder is screened once, by eye:

```bash
node tools/broll-pool.mjs "~/Documents/Adsora/Video Assets Raw/B-Roll/BATH" \
  --out ad-remix-runs/<slug>/broll-pool.json --sheet ad-remix-runs/<slug>/broll-sheet.jpg
# Read the sheet (one numbered mid-clip frame per clip), then freeze the survivors:
node tools/broll-pool.mjs "~/Documents/Adsora/Video Assets Raw/B-Roll/BATH" --drop 4,11,17 \
  --out ad-remix-runs/<slug>/broll-pool.json
```

Point the jobs file at it with `brollPool` and only the survivors are used.
Keep the pool file in the run folder so the run log shows what was screened.
Full rule: `references/house-defaults.md` §3.

---

## 3. What it does, and what that means for the prompts

Stage 4 does not write model prompts for this format. It writes **the script**
(the exact spoken words, since the voice reads them verbatim), **the b-roll
brief** (what footage the folder needs to contain), and **the jobs file**.

- **The voice: a Kokoro preset by default, or a clone where it matters.** With no
  `refAudio`, Kokoro reads the script — 54 fixed voices, no accent prompting:
  `af_*` American female, `am_*` American male, `bf_*` / `bm_*` British. Pick an
  American voice (`af_*` / `am_*`; house reads am_adam / af_sarah) unless the
  user asked for another accent (hard rule 17). Don't write accent directions
  into the script and expect them to land. **To match a
  specific voice** (a spokesperson, a series' recurring VO, a competitor's read),
  give the job (or the config) a `refAudio` — a clean ~7–12s WAV of that voice —
  and `faceless.mjs` clones it zero-shot with **Chatterbox** instead. Cloning
  fires **only where a `refAudio` is present**; every other job stays on Kokoro,
  which is faster. Chatterbox ignores `speed`; steer it with `exaggeration` /
  `cfgWeight` / `temperature`. Build the ref by isolating the voice off any music
  bed (Demucs `--two-stems=vocals`) → mono 24 kHz. Zero-shot takes glitch ~1 in 4
  (a swallowed word) — just rerun that job. Clone venv: `~/.adsora/vc-chatterbox`
  (`uv pip install --python ~/.adsora/vc-chatterbox/bin/python chatterbox-tts`).
- **Faceless ads use the house preset; they never clone on their own.** Cloning
  is for avatar-led formats, where the b-roll voiceover has to match the
  generated person on screen. A faceless ad has nobody on screen, so there is
  nothing to clone from: the default is `am_adam` at 1.1 (`af_sarah` at 1.2 for
  a female read), measured at ~185 wpm, and it only clones when the user hands
  over a `refAudio`. `references/house-defaults.md` §1.
- **Captions are the written words, timed by the heard ones.** The script is
  aligned to the transcript by edit distance, not zipped position-for-position,
  because a transcriber writes "2026" where the script says "twenty twenty-six"
  and one dropped filler word would drift every caption after it. Caption text is
  always what was written; only the timing comes from what was heard. The cards
  follow the house spec in `tools/captions.mjs`: Gotham Black, one to three
  words and at most sixteen characters per card, a new card at any pause over
  0.45s or a sentence end, the spoken word highlighted. The corrections map in
  the same file repairs the words a transcriber reliably mangles *before*
  alignment, so timing lands on them; it never rewrites the script.
- **Footage order is seeded by the script, not the hook.** The seed is the job
  name up to `__`, so `<script>__<hook>` jobs share one montage and only the
  opener differs: one body, many hooks, which is what makes it a hook test. A
  rerun reproduces the edit instead of quietly becoming a different ad. Set
  `seed` on a job to force a different draw.
- **Clips are folded in pairwise**, two inputs at a time with a crossfade, each
  intermediate deleted as it goes. A 20-scene ad never holds 20 encoded segments
  on disk, and never asks a filter graph to xfade 20 simultaneous inputs.
- **Music sits under the voice at a fixed gain** and is faded in and out. It is
  never ducked against the voice, so a bed that fights the read is a bed
  chosen too loud — lower `musicVolume`, do not add ducking.

---

## 4. Cost and quota

Zero per clip, caption timing included (local whisper.cpp). It never needs a
cost quote — but say so in
the Stage 5 quote table rather than leaving the format off it:

```
| faceless-vo-broll | 4 ads | local render (tools/faceless.mjs) | $0.00 |
```

---

## 5. When it fails

| Symptom | Cause | Fix |
|---|---|---|
| Exits 0, MP4 has no voice | espeak data not found; Kokoro produced no audio | `brew install espeak-ng`, confirm `/opt/homebrew/share/espeak-ng-data/phontab` exists |
| `uv pip install kokoro` fails compiling blis | Python 3.13 | rebuild the venv with `--python 3.11` |
| Worked last week, now "no such file or directory" on the python path | the venv lived somewhere the OS wiped | rebuild it at `~/.adsora/kokoro` |
| `whisper-cli not found` / `no whisper model in ~/.adsora/whisper` | whisper.cpp or its model is not installed | `brew install whisper-cpp`; download the model (Setup above) |
| `no clips found in <brollDir>` | wrong path, or the folder holds stills | point at a folder of mp4/mov; stills need converting first |
| ffmpeg hangs at 0% CPU forever | not this script — it closes stdin and drops stdout for exactly this reason | if you fork the render, keep `-nostdin` and `stdio: ["ignore","ignore","pipe"]` |
