# Setup — Claude Code cloud sessions

This is the cloud/sandbox counterpart to `SETUP.md` (which assumes macOS +
Homebrew). A cloud session's container already has Node, a pre-installed
Playwright Chromium, and `ffmpeg`. The two things that are different from a
laptop are **network access** and **no Homebrew**, handled below.

## 1. Network: run this skill in an environment that allows Facebook

Cloud sessions route all outbound HTTPS through a policy-enforcing proxy that
denies hosts not on the environment's allowlist — the Default environment
typically does not include Facebook. `harvest.mjs` needs:

- `www.facebook.com`, `facebook.com` — the Ad Library itself
- `static.xx.fbcdn.net`, `scontent.xx.fbcdn.net`, `video.xx.fbcdn.net` — ad
  creative media (images/video), fetched during the MEDIA stage
- `huggingface.co`, `cas-bridge.xethub.hf.co` — only if you fetch the
  whisper.cpp model for video transcription

If an environment with those hosts already exists for this repo, select it
when starting the session (environment can't be switched mid-session). If
not, create/edit one (Settings → Environments, or ask Claude to propose it
via `update_environment` when a run gets a 403) with `network_access:
"limited"` and those hosts added — never "unrestricted" for a research tool
that only needs a handful of named hosts.

`harvest.mjs` itself needs no other change for this — Playwright's browser
reads the `HTTPS_PROXY`/`https_proxy` env var (already set in every cloud
session) automatically.

## 2. Browser binary: no `npx playwright install` needed

Cloud containers ship a pre-installed Chromium at `PLAYWRIGHT_BROWSERS_PATH`,
but its revision can trail whatever `npm install` resolves for the
`playwright` package, which then reports "Executable doesn't exist". You
don't need to fix this by hand — `harvest.mjs` already falls back to
whichever Chromium build is actually on disk under `PLAYWRIGHT_BROWSERS_PATH`
when the expected one is missing, with no env var needed. Just:

```bash
cd .claude/skills/fb-ad-library-research
npm install
```

Do **not** run `npx playwright install chromium` here — it tries to download
from Playwright's CDN, which is not on the allowlist above and isn't needed
since a build is already on disk.

## 3. `ffmpeg` + `tesseract` (frame extraction + OCR)

`ffmpeg` is already on `PATH` in the container. `tesseract` is not — install
it with apt (root is available, no Homebrew on Linux):

```bash
apt-get update && apt-get install -y tesseract-ocr
```

## 4. whisper.cpp (video transcription) — optional, heavier lift

There's no Homebrew formula on Linux. Two options, in order of effort:

- **Skip it.** `run.sh ... --media` without a working `whisper-cli` still
  gets you every ad's copy, images, and OCR'd on-screen text — just not
  spoken-voiceover hooks. For a first cloud run this is a reasonable
  trade-off; say so in the report per the skill's "partial run" rule.
- **Build it**, once `huggingface.co` is allowlisted for the model download:
  ```bash
  apt-get install -y build-essential git cmake
  git clone https://github.com/ggml-org/whisper.cpp /opt/whisper.cpp
  cmake -B /opt/whisper.cpp/build -S /opt/whisper.cpp && cmake --build /opt/whisper.cpp/build -j --config Release
  ln -s /opt/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli
  mkdir -p ~/.ad-research/whisper
  curl -L -o ~/.ad-research/whisper/ggml-large-v3-turbo.bin \
    https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
  ```
  This is exactly what a one-time **environment setup script** is for, so it
  runs automatically on every fresh container instead of by hand each time.

## 5. First run

Same as `SETUP.md` from here:

```bash
NICHE=loan
DATE=$(date +%F)
node tools/harvest.mjs --niche $NICHE --date $DATE
./tools/run.sh $NICHE $DATE --media
```

If `harvest.mjs` still fails with `net::ERR_TUNNEL_CONNECTION_FAILED` or
a 403, the environment's allowlist is the first thing to check — it's a
network policy decision, not a script bug (confirm with `curl -sS
"$HTTPS_PROXY/__agentproxy/status"`, which lists recent denied hosts).
