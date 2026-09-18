# Setup — macOS

One-time setup. After this, the weekly run is just the two commands in
`RUNBOOK.md`.

## 1. Homebrew (skip if you already have it)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 2. Node.js

```bash
brew install node
node -v     # should print v18 or newer
```

## 3. This skill's Node dependencies (Playwright + a Chromium build)

```bash
cd ~/.claude/skills/fb-ad-library-research   # wherever you put this folder
npm install
npx playwright install chromium
```

`npx playwright install chromium` downloads a browser binary Playwright
manages itself (separate from any Chrome you have installed) — this is what
`harvest.mjs` launches in a disposable profile each run.

## 4. ffmpeg + tesseract (video frame extraction + OCR)

```bash
brew install ffmpeg tesseract
```

## 5. whisper.cpp (local, offline video transcription)

```bash
brew install whisper-cpp
```

Then pull the model `media.sh` expects:

```bash
mkdir -p ~/.ad-research/whisper
curl -L -o ~/.ad-research/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

That download is a few hundred MB — expect a few minutes. A smaller/faster
model (e.g. `ggml-base.en.bin`) also works if you'd rather trade accuracy for
speed; just point `MODEL=` in `tools/media.sh` at whichever file you use.

Confirm the `whisper-cli` binary is on your `PATH`:

```bash
which whisper-cli
```

If Homebrew installed it under a different command name on your machine,
edit the `whisper-cli` call near the bottom of `tools/media.sh` to match.

## 6. Put the skill where Claude Code can find it

```bash
mkdir -p ~/.claude/skills
mv fb-ad-library-research ~/.claude/skills/
cd ~/.claude/skills/fb-ad-library-research
npm install   # if you hadn't already, now that it's in its final location
```

## 7. Sanity-check the harvester on its own, before a full run

```bash
node tools/harvest.mjs --niche loan --date $(date +%F) --headed
```

`--headed` pops an actual visible Chromome window so you can watch it load
the Ad Library and confirm it isn't showing a login wall. Once you've
confirmed it works, drop `--headed` for normal (headless, faster) runs.

## 8. First real run

```bash
NICHE=loan
DATE=$(date +%F)
node tools/harvest.mjs --niche $NICHE --date $DATE
./tools/run.sh $NICHE $DATE --media
```

See `RUNBOOK.md` for what happens at each step and where the outputs land.

---

## Before your first run: fill in `config/niches/loan.json`

The starter config has real keywords but an **empty `seed_pages` list** —
I don't know who your competitors are. After the first keyword-sweep run,
open `_reports/<date>/raw/ads-01.json` (or just read `REPORT.md`) and see
which pages showed up a lot; add the ones you want a full weekly library pull
on (not just keyword-sweep hits) to `seed_pages` by **name** — `harvest.mjs`
resolves names to page IDs itself and caches the result.
