# The song maker — generate music & songs locally (ACE-Step)

The skill's **local music generator**: full songs *with vocals*, jingles, or
instrumental beds, made on this machine, **no web UI, no API, no per-track cost**
(GPU time only). Because the output is generated locally it is **yours to use**,
which clears the house no-unlicensed-music rule (`references/edit-assembly.md` §9).

Driven by `tools/song.mjs`, which wraps **ACE-Step 1.5** (open-source, runs on
Apple Silicon via MLX, or CUDA/CPU elsewhere). The tool is headless and
unattended — it never opens the ACE-Step web UI.

**Two things use it:**
1. The **cartoon music video ad** format, where the song *is* the ad
   (`references/formats/cartoon-music-video.md`).
2. A **bespoke bed** for any format, but only when nothing in the house
   `Soundtracks/` pool fits — pool first, generate as the fallback (hard rule 20,
   `references/house-defaults.md` §4).

---

## 1. Setup (once per machine)

ACE-Step is a separate open-source install the tool calls into. It is **not**
bundled with the skill (the model weights are ~10GB). Install it once:

```bash
brew install git ffmpeg uv
git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/.adsora/ace-step
cd ~/.adsora/ace-step && uv sync
```

- `uv sync` builds the virtualenv and picks a compatible **Python 3.11/3.12**
  automatically (your system Python version does not matter).
- The **model weights auto-download on the first generation** (~10GB, one time).
  After that it runs **fully offline**.
- Apple Silicon uses the native **MLX** backend automatically; other machines
  auto-detect **CUDA** or fall back to **CPU**.

Keep the install somewhere durable like `~/.adsora/ace-step` (the same place the
faceless voice venvs live) — a scratch/temp folder gets wiped on reboot.

**Where the tool looks for it**, in order: a job/config `acestepHome` →
the `ACESTEP_HOME` env var → `~/.adsora/ace-step` → `~/ACE-Step-1.5` →
`~/Documents/Adsora/ACE-Step-1.5` → `./ACE-Step-1.5`. If you cloned it
elsewhere, either set `ACESTEP_HOME` or put `acestepHome` in the jobs file.

**Check it:**

```bash
node tools/song.mjs --health
```

`LIVE` means the install and venv are found; it also says whether the weights are
downloaded yet. If it is not found, it prints the install command.

Nothing to buy, no key, no `.env` entry. If ACE-Step is not installed, the song
maker is simply unavailable — the skill says so and, for a bed, falls back to the
house `Soundtracks/` pool; the cartoon-music-video format degrades to a
prompt-only hand-off (the lyrics + a note to generate the song).

---

## 2. Run it

```bash
node tools/song.mjs song.json           # generate every track in the file
node tools/song.mjs song.json --plan    # print what it would make, generate nothing
node tools/song.mjs --health            # verify the ACE-Step install
```

Copy `tools/song.example.json` to start. Finished tracks land in the jobs file's
`outDir` as `<name>.<format>` (e.g. `05-assets/song/cartoon-anthem.mp3`).

Roughly **1–2 minutes per track** on an M-series Mac for a 30–45s song (turbo
model). First run of a session adds ~20s of model load.

---

## 3. The jobs file

```json
{
  "acestepHome": "~/.adsora/ace-step",   // optional; else auto-detected
  "outDir":      "./05-assets/song",     // where finished tracks land
  "audioFormat": "mp3",                  // mp3 | wav | flac   (default mp3)
  "lmModel":     "acestep-5Hz-lm-1.7B",  // optional, see §5
  "jobs": [ { … } ]
}
```

### Per job

| Field | Meaning |
|---|---|
| `name` | output basename → `<outDir>/<name>.<format>` (required) |
| `caption` | the **style/genre** description — instruments, mood, vocal type, energy. This is the main creative dial. |
| `lyrics` | the **exact lyrics**, passed verbatim (no rewrite). Use ACE-Step section tags: `[Intro] [Verse] [Chorus] [Bridge] [Outro]`, one lyric line per line. Escape newlines as `\n` in JSON. |
| `lyricsFile` | path to a `.txt` of lyrics instead of inline `lyrics` |
| `instrumental` | `true` = a bed with **no vocals** (ignore `lyrics`). Default `false`. |
| `duration` | length in **seconds**. Omit or `-1` = the model decides from the lyrics. |
| `vocalLanguage` | e.g. `"en"` (optional) |
| `bpm`, `keyscale`, `timesignature` | optional musical constraints (`"C major"`, `"4"`) |
| `seed` | a fixed integer = **reproducible** output; omit for a fresh roll each time |
| `sampleQuery` | **let the model write the lyrics** from a one-line vibe (e.g. `"a 20s cheerful jingle about free shipping"`). When set, `caption`/`lyrics` are ignored. |

Three job shapes:
- **Song from your lyrics** — `caption` + `lyrics`, `instrumental: false`. Your
  lyrics sung verbatim. This is the default for a scripted ad song.
- **Instrumental bed** — `caption` + `instrumental: true`. No vocals.
- **Auto-written** — `sampleQuery` only. The model invents bpm/key/lyrics from
  the description. Fastest way to a jingle; less control over the words.

---

## 4. Writing a good `caption`

The caption is a plain comma-separated style brief, not a sentence to sing.
Name, in rough order: **genre → vocal type → key instruments → energy/mood →
production feel**. Examples:

- `upbeat pop-punk, bright male gang vocals, distorted guitars, four-on-the-floor, huge singalong chorus, handclaps`
- `warm acoustic folk, gentle female vocals, fingerpicked guitar, brushed drums, cozy and sincere`
- `90s boom-bap hip hop instrumental, dusty piano loop, vinyl crackle, hard drums, no vocals`
- `synthwave, driving arpeggio bass, gated reverb drums, nostalgic, cinematic`

Keep lyrics short and punchy for an ad — a hook line and a chorus land better
sung than a wall of verses. Put the **offer/CTA in the chorus** so it repeats.

---

## 5. Models & quality

The tool defaults to ACE-Step's own defaults (the **turbo** DiT, fast) plus the
5Hz language model your machine's memory can handle. Override the LM per jobs
file with `lmModel`:

| `lmModel` | Use when |
|---|---|
| `acestep-5Hz-lm-0.6B` | low memory (≤8GB), fastest, least coherent lyrics |
| `acestep-5Hz-lm-1.7B` | **recommended** for 16–48GB — best balance |
| `acestep-5Hz-lm-4B` | max quality, needs ~24GB+ free memory |

The DiT and LM weights all live under `<install>/checkpoints/` and are shared
across runs.

**Why it never hangs (the headless recipe).** ACE-Step's CLI pauses for
interactive prompt-editing only when `thinking=true`. `tools/song.mjs` writes
`thinking=false` and feeds `/dev/null` on stdin, so it runs unattended. The 5Hz
LM still enriches the caption and fills bpm/key metadata — only the editing pause
is off. You do not need to touch this; it is why the tool works in a pipeline.

---

## 6. House rules

- **Pool first for beds (hard rule 20).** A background bed under a voice ad still
  comes from `~/Documents/Adsora/Video Assets Raw/Soundtracks/` first. Generate a bed
  only when nothing in the pool fits the ad's energy — then drop the new track
  into `Soundtracks/` so the next run finds it (rule 16 widened).
- **Generated music is cleared music.** A locally generated track is yours, so it
  satisfies `references/edit-assembly.md` §9 ("no unlicensed music"). Never
  generate a melody or lyrics that imitate a specific copyrighted song, artist,
  or a recognizable hook — keep it original and generic (same spirit as the
  cartoon/visual originality guardrails).
- **Volume depends on the track's role.** If it is a **song that carries the ad**
  (the cartoon music video, or any music-video cut where the track *is* the ad),
  keep it at **full volume** (`musicVolume` 1.0) — it is the audio, not a bed. If
  it is a **background bed under a voice**, keep it **low** at the fixed
  `musicVolume` and never duck it (`edit-assembly.md` §8), same as a pool bed.
  Song → full; bed → low.
- **Log it.** Put the generated track's path and prompt in the run log so a
  re-cut can find or re-roll it.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `--health` says NOT found | Clone + `uv sync` per §1, or set `ACESTEP_HOME` to your install. |
| First generation is slow / stalls at 0% | It is downloading ~10GB of weights on first run. Let it finish once; subsequent runs are offline and fast. Check network. |
| Out of memory / very slow | Drop `lmModel` to `acestep-5Hz-lm-0.6B`, or shorten `duration`. |
| Lyrics came out re-worded or mumbled | Keep lines short and simple; add clearer section tags; try the `1.7B` LM; re-roll with a different `seed`. |
| Vocals when you wanted a bed | Set `"instrumental": true`. |
| Track is the wrong length | Set `duration` explicitly (seconds); the model otherwise picks a length from the lyrics. |
| Want the same track again | Set a fixed `seed`. Same seed + same inputs = same song. |
