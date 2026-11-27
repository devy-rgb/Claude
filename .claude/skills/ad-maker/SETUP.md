# SETUP — Performance Creative Producer

Written for someone who has **never used Claude Code before**. Follow it top to
bottom. It takes about 15 minutes, most of which is installing one app.

**Fastest install:** once Claude Code is installed (Part 1 below), open it, drag
this whole `ad-maker` folder into the chat, and type
`install the skill in this folder`. It does Part 2 for you. `READ-ME-FIRST.txt`
and the PDF guide have the short version; the rest of this file is the full,
click-by-click walkthrough.

The skill works in two levels:
- **Prompt-only (no setup beyond installing the skill):** you get finished,
  paste-ready image and video prompts for every ad format. You paste them into
  whatever generation tool you already use.
- **Full generation (optional, +5 minutes):** connect a video-generation service
  and the skill also produces the actual images and clips.

You can start prompt-only today and add generation later.

---

## Part 1 — Install Claude Code

Claude Code is a coding assistant that runs on your computer. This skill is a
"skill" it can load.

### 1.1 Install it

- **Desktop app (easiest):** go to **claude.com/code**, download the app for
  Mac or Windows, install it, and sign in with your Anthropic account.
- **Or the terminal version:** install [Node.js](https://nodejs.org) (LTS), then
  in a terminal run:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
  Start it by opening a terminal in the folder you want to work in and typing
  `claude`.

### 1.2 Open a working folder

Make a folder anywhere for your ad work, for example `Documents/ad-remix`. In the
Claude Code app, use **Open Folder** and pick it. In the terminal, `cd` into it
and run `claude`.

Everything the skill produces will be saved inside this folder, under
`ad-remix-runs/`.

---

## Part 2 — Install the skill

A skill is just a folder named `ad-maker/` containing a
`SKILL.md` file and a `references/` folder. You put it where Claude Code looks
for skills.

### 2.1 Where skills live

| Scope | Put the folder here |
|---|---|
| Just this project | `<your working folder>/.claude/skills/ad-maker/` |
| Every project on your machine | `~/.claude/skills/ad-maker/` (Mac/Linux) or `C:\Users\<you>\.claude\skills\ad-maker\` (Windows) |

`~` means your home folder. `.claude` is a hidden folder — create it if it isn't
there.

### 2.2 Copy the folder in

Copy the entire `ad-maker/` folder (this file's parent — it
contains `SKILL.md`, `references/`, `config/`) into one of the locations above.

Final layout should look like:

```
.claude/skills/ad-maker/
├── SKILL.md
├── SETUP.md
├── QUICKSTART.md
├── references/
│   ├── pipeline-and-status.md
│   ├── stage-1-intake.md ... stage-5-generate.md
│   ├── copywriting-core.md
│   ├── production-discipline.md
│   ├── model-specs.md
│   ├── generation-adapters.md
│   ├── adsoragen-video.md · faceless-video.md · edit-assembly.md
│   └── formats/  (one module per format)
├── tools/
│   ├── adsoragen.mjs   (Adsora Gen — face UGC on our own GPU)
│   ├── faceless.mjs    (local VO + b-roll render)
│   ├── song.mjs        (local song maker — ACE-Step; music & jingles)
│   ├── assemble.mjs    (the edit)
│   └── card.mjs        (flat graphics)
└── config/
    ├── generators.example.json
    ├── adsoragen.env.example   → copy to adsoragen.env and fill (Adsora Gen keys)
    └── adsoragen/              (the four H3 ComfyUI graphs)
```

### 2.3 Check it loaded

Start Claude Code in your working folder and type:

```
/help
```

or just ask: **"list my skills"**. You should see
`ad-maker` in the list. If you don't:
- make sure the folder is named exactly `ad-maker`
- make sure `SKILL.md` is directly inside it (not in a subfolder)
- restart Claude Code

---

## Part 3 — (Optional) Connect the generators

Skip this if you only want prompts. You can add any of it at any time.

There is no MCP and nothing to click. Everything is an **API key in a `.env`
file** in the folder you run the skill from — the same file the rest of your
tools already read. The one exception is Adsora Gen, whose keys sit inside the
skill itself at `config/adsoragen.env` so they travel with it. Three separate
things can be turned on, independently.

### 3.1 Evolink — the default, covers everything

```bash
# .env in your working folder
EVOLINK_API_KEY=sk-...
```

That is the whole setup. Evolink is a plain HTTP API
(`https://api.evolink.ai/v1`) and it covers every image model (GPT Image 2, Nano
Banana Pro) and every third-party video model (Seedance 2.0 / 2.5) the skill
targets. There is no login to keep alive and nothing that expires.

If you need to point at a different host, add `EVOLINK_BASE_URL` — it must end in
`/v1`. Media generation lives on `api.evolink.ai`; Evolink's `direct.evolink.ai`
host is their text/chat service and is **not** what this skill calls. A media
request sent there hangs and times out instead of failing cleanly, so if
generations stall, check the host first.

### 3.2 Adsora Gen — for face-to-camera UGC (optional)

The "face" formats — **raw UGC yapper**, **talking-head**, **in-car UGC**,
**reply-to-comment** and **UGC dialogue** — go to our own model (MiniMax H3) on
our own RunPod GPU instead of a vendor, whenever the skill's own key file is
filled. Unlike Evolink, these keys live **inside the skill folder**:

```bash
cp config/adsoragen.env.example config/adsoragen.env
```

Then fill the two required lines in `config/adsoragen.env`:

```bash
RUNPOD_API_KEY=rpa_...                    # RunPod console → Settings → API Keys
RUNPOD_VIDEO_ENDPOINT_ID=7ud39rwzgljmtj   # the "adsora-gen" endpoint (pre-filled)
```

and put the four ComfyUI graphs the worker runs in `config/adsoragen/`
(`h3-t2v.json`, `h3-i2v.json`, `h3-s2v.json`, optional `h3-s2v-chain.json`).
Key, endpoint and graphs all live in the Adsora webchat Vercel project too, so
the whole fill is three commands in your own terminal — never in chat:

```bash
cd ~/Documents/webchat-vercel && vercel env pull /tmp/adsora-prod.env --environment=production
node ~/.claude/skills/ad-maker/tools/adsoragen.mjs --import-env /tmp/adsora-prod.env
rm /tmp/adsora-prod.env
```

Check it: `node tools/adsoragen.mjs --health` prints what is set (never the
values), which graphs exist, and whether the endpoint has workers. `LIVE` means
face UGC routes here.

It generates its own synchronised audio, does up to 15 seconds in one pass, and
costs GPU time (about 11 cents for a 5-second clip, 55 cents for 15 seconds at
480p) rather than a per-clip vendor price. It is also the only model here that
will lip-sync to a voiceover you supply — and the skill puts your exact voice
back over its picture, because H3 re-synthesizes the audio it is given.

Claude drives it through the RunPod API from your machine with
`tools/adsoragen.mjs` and saves every clip into the run folder as it finishes.
You never open the Adsora Gen web app for a run, and nothing is left on the
server to fetch later. Full procedure: `references/adsoragen-video.md`.

**If the key file is missing or half-filled, nothing breaks.** Face UGC falls
back to Evolink at vendor pricing and the cost quote tells you it did. It never
silently skips the format.

**Do not ship the filled file.** Only `adsoragen.env.example` belongs in a copy
you hand to someone else.

### 3.3 Faceless ads — nothing to buy, but two things to install

The **faceless VO + b-roll** format doesn't use a generation API at all. It
renders on your machine:

```bash
brew install espeak-ng ffmpeg uv whisper-cpp
uv venv --python 3.11 ~/.adsora/kokoro
uv pip install --python ~/.adsora/kokoro/bin/python kokoro soundfile
VIRTUAL_ENV=~/.adsora/kokoro ~/.adsora/kokoro/bin/python -m spacy download en_core_web_sm
```

Keep the venv somewhere durable like `~/.adsora/kokoro` — one under a temp or
scratchpad folder gets wiped on reboot and the render stops working with no
obvious cause.

**Optional — voice cloning.** Kokoro is preset-only. To make a faceless ad in a
*specific* voice (a spokesperson, a recurring series VO), add a second venv and
pass a `refAudio` in the jobs file; `faceless.mjs` then clones that voice with
Chatterbox instead of using a preset. Only jobs with a `refAudio` clone — the
rest stay on Kokoro.

```bash
uv venv --python 3.11 ~/.adsora/vc-chatterbox
uv pip install --python ~/.adsora/vc-chatterbox/bin/python chatterbox-tts
```

Build the reference by isolating the target voice off any music bed (Demucs
`--two-stems=vocals`) and saving ~7–12s as mono 24 kHz WAV. Runs on Apple MPS.

Caption timing is local and free: `brew install whisper-cpp` and put
`ggml-large-v3-turbo.bin` in `~/.adsora/whisper/` (the one-liner is in
`references/edit-assembly.md` §1). No key and no cost anywhere in this path.

Python **3.11** and homebrew **espeak-ng** are both hard requirements, not
preferences; `references/faceless-video.md` explains why each one breaks the
render if you substitute it.

### 3.4 The local song maker — music, songs & jingles (optional, nothing to buy)

Like the faceless format, this uses **no generation API** — it runs a local
open-source model (**ACE-Step 1.5**) on your machine. It makes original songs with
vocals, jingles, and instrumental beds — used by the **cartoon music video** ad
(where the song is the whole ad) and as a fallback bed when nothing in your
`Soundtracks/` pool fits. No key, no per-track cost (GPU time only).

Install ACE-Step once:

```bash
brew install git ffmpeg uv
git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/.adsora/ace-step
cd ~/.adsora/ace-step && uv sync
```

`uv sync` builds the environment and picks a compatible Python (3.11/3.12) on its
own. The model weights (~10GB) **auto-download on the first song** and then it
runs fully offline. Apple Silicon uses the native MLX backend automatically;
CUDA/CPU are auto-detected on other machines. Keep the clone somewhere durable
like `~/.adsora/ace-step` (a temp/scratch folder gets wiped on reboot).

Check it: `node tools/song.mjs --health` prints where it found the install and
whether the weights are downloaded. Generate with a jobs file:

```bash
cp tools/song.example.json song.json   # edit caption + lyrics
node tools/song.mjs song.json          # → tracks in ./05-assets/song/
```

The tool finds the install via `ACESTEP_HOME`, then `~/.adsora/ace-step`,
`~/ACE-Step-1.5`, `~/Documents/Adsora/ACE-Step-1.5`, `./ACE-Step-1.5`.
Set `ACESTEP_HOME` (or `acestepHome` in the jobs file) if you cloned elsewhere.
**If ACE-Step is not installed, nothing breaks** — a bed falls back to the
`Soundtracks/` pool and the cartoon-music-video format degrades to handing you the
lyrics + a note to generate the song. Full guide: `references/song-maker.md`.

### 3.5 Nothing else to configure

One thing to know, not to install: the reply-to-comment bubble, headline
callouts, notes cards and legal boxes are typeset by `tools/card.mjs` through
the Google Chrome (or Chromium / Edge) already on the machine, headless. If
there is no browser the tool says so and the same graphics are approximated
with `text` blocks in `assemble.json`. `CHROME_PATH` points it at an unusual
install location.

The skill already defaults to Evolink and already knows to route face UGC and
faceless work. You do **not** need to create `config/generators.json` unless you
want to change something — the most common edit is `budget_usd` (the hard
spending cap per run, default **US$5**). To change it, copy
`config/generators.example.json` to `config/generators.json` and edit that one
number.

If you don't configure anything, the skill runs **prompt-only** and tells you so —
you still get every prompt, ready to paste into whatever tool you use.

### 3.6 Prefer fal.ai instead?

`config/generators.example.json` also has a `fal` adapter (GPT Image 2, Nano
Banana, Kling, Seedance, pay-as-you-go). To use it: connect a fal.ai MCP (or set
`FAL_KEY` in your environment and have the `fal` CLI on PATH), copy the example
config to `generators.json`, and set `"default_adapter": "fal"`.

---

## Part 4 — Your first competitor-ad breakdown (worked example)

Open Claude Code in your working folder and say:

> **Remix this competitor ad for my product.**

Claude loads the skill and starts the five-stage pipeline. Here is what each
stage looks like with placeholder content. Your real run uses your real ad and
product.

### Stage 1 — INTAKE

Claude asks how you have the competitor ad. You paste a transcript:

> Competitor ad (≈35s, a two-person podcast clip):
> "…here's what nobody tells you about most water bottles."
> "Wait, what do you mean they're the problem?"
> "The plastic ones leach taste. The steel ones sweat all over your bag. So people
> just stop carrying one and drink way less than they should."
> "So what changed?"
> "We built one with a vacuum wall and a copper liner. Zero sweat, zero metal
> taste. Third-party lab tested it holds cold for 24 hours."
> "And people are actually drinking more?"
> "Our buyers report about 30% more water a day. It's just… always there and it's
> never gross."
> "Where do people get it?"
> "Link's in the bio. Try it for a week."

Claude writes `ad-remix-runs/2026-09-02-water-bottle-podcast/01-intake.md`, notes the
verbatim hook and CTA, and moves on.

### Stage 2 — ANALYZE

Claude shows a **readable** breakdown (not a JSON blob):

```
━━━━━━━━━━━━━━━━━━━━━━
PERSUASION DNA
━━━━━━━━━━━━━━━━━━━━━━
HOOK:        "here's what nobody tells you about most water bottles" — type: curiosity loop
CLAIM:       a bottle you'll actually carry, so you drink more
MECHANISM:   vacuum wall + copper liner → no sweat, no metal taste — named: no
PROOF:       "third-party lab tested, 24h cold" → "buyers report ~30% more water/day"  (strongest: the 30% number, right after the mechanism)
BELIEF SHIFT: from "I've tried bottles, they're all annoying so I gave up" → to "this one removes the exact annoyances, so carrying it is effortless"
AVATAR:      someone who knows they should drink more water and has quit two bottles already
DESIRE:      effortless healthy habit | DRIVER: comfortable living
EMOTION ARC: mild guilt → curiosity → recognition → relief
AWARENESS:   Problem-aware  | SOPHISTICATION: Stage 3 (needs a mechanism, not just a claim)
NESB:  N: "nobody tells you"  E: "always there, never gross"  S: "lab tested"  B: "30% more a day"
OBJECTIONS HANDLED: "bottles are all the same" (names two specific failures), "does it really work" (lab + buyer number)
WINNING ELEMENT: reframing the prospect's past failures as evidence FOR the pitch
FORMAT SEEN: podcast two-shot, mics visible, warm studio, calm pace
━━━━━━━━━━━━━━━━━━━━━━
```

…plus a beat table and 4 sentences of plain explanation. Claude asks: *"Does this
match the ad as you see it?"* You say "yep".

### Stage 3 — REBUILD (the checkpoint)

Claude runs the short intake:

> **Product:** a refillable electrolyte tablet tube — drop one tablet in water,
> no sugar.
> **Offer:** US$19 for a 30-tablet tube, subscribe-and-save 15%, 60-day
> money-back.
> **Character:** no strong preference — a real-person UGC creator is fine.
> **Tone:** plain, a little dry, no hype.

Claude writes `03-rebuild.md`: the same 7 beats, same curiosity-loop hook, same
"reframe past failures" move, same proof-after-mechanism order — now about the
electrolyte tube. Five hook variations. A proposed on-screen creator (age,
look, voice, a real kitchen). Then it **stops**:

> Here's the rebuilt script and the proposed creator. **Nothing is generated and
> no credits are spent until you approve this.** Reply "approved", or send edits.

You read it, ask for a shorter CTA line, Claude revises, you say **"approved"**.

### Stage 4 — FAN OUT

Claude asks which formats. You say **"podcast duo, UGC yapper, and the whiteboard
explainer"**. Claude writes three files in `04-prompts/` — each with a frame
manifest, paste-ready image prompts, paste-ready clip prompts, and an assembly
note. It shows them and asks whether to generate or hand them back.

### Stage 5 — GENERATE & DELIVER

- **If a generator is configured:** Claude shows a cost table (e.g. "$3.40 of
  $5.00 budget"), naming which backend each format goes to, you say "go", it
  generates the stills then the clips, downloads them to `05-assets/`, cuts each
  format into a finished ad in `06-finals/` (captions, banner, b-roll, end
  card, no disclaimer — there is no CapCut step for you), and writes
  `run-log.md` with the reported cost.
- **If none is:** Claude says "no generator configured — prompt-only", and hands
  back every prompt with a note on where to paste each one.

Either way you end with a dated folder containing the breakdown, the approved
script, every prompt, any assets, the finished ads, a `DELIVERY.md` summary, and
`run-log.md`.

### Checking progress from your phone

While a run is going, open `ad-remix-runs/<run-folder>/STATUS.md` from any device
(it syncs if your working folder is in Dropbox/iCloud/Drive). It always says which
stage you're on and whether it's **waiting for your approval**.

---

## Part 5 — Run it hands-off from a walk

The attended flow above stops to ask you things three times. **Hands-off mode**
collapses that to one: it stops once, when the rebuilt script and avatar are
ready, sends your phone a notification, and after your one "approved" it runs the
rest — fan out and generation — with no more prompts.

### 5.1 Kick it off

Say, at the start:

> **Remix this competitor ad and run it hands-off.** [paste / attach the ad]

It reads your ad, does the breakdown, rebuilds the script + avatar, then **stops**
and you get a notification: *"script + avatar ready — reply approved to run it."*

### 5.2 What it pre-commits (so it doesn't have to ask later)

From `config/generators.json` → `hands_off` (or it asks once at kickoff):

- **which formats** to build (default: UGC yapper, podcast duo, whiteboard,
  Simpsons)
- **auto-generate** after the prompts are written (default: yes, via Evolink,
  with face UGC on Adsora Gen and faceless rendered locally)
- **a spending ceiling** the cost quote may pass under without asking (default
  $5). If a run would cost more, it stops and notifies instead of spending.

Edit those four lines in `config/generators.json` to your taste. Nothing else.

### 5.3 The one tap

You get the notification, open `03-rebuild.md` on your phone, read it, reply
**`approved`** (or `approved, but shorten the CTA` — it folds edits in). That
reply is the trigger. From there it fans out, quotes the cost, sees it's under
your ceiling, generates, and you get a second notification: *"done — 12 clips
across 4 formats, $3.72."*

### 5.4 Making "laptop closed" literally true

Something has to be running the agent. For a genuine phone-only run:

- **Easiest:** use **claude.ai/code** in your phone's browser. The agent runs in
  Anthropic's cloud, so your laptop can be shut. Open the folder there, kick off
  hands-off, walk away.
- **Or:** run Claude Code on an always-on machine (a mini PC, a cheap VPS, a home
  server) and connect to it from your phone.

Either way, the keys have to exist **on the machine that runs the agent**, not on
your laptop. API keys don't expire the way a login does, so there's nothing to
refresh — but if you kick a run off from claude.ai/code, the `.env` has to be in
the folder you opened there. The faceless format additionally needs `ffmpeg` and
the Kokoro venv on that machine; a host without them falls back to prompt-only
for that one format and still builds everything else.

### 5.5 What it will still never do on its own

- Approve the script for you. That one tap is always yours.
- Spend over your ceiling.
- Keep retrying after a content-block or a login failure. It stops and pings you
  with *"needs your call"*.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Skill doesn't show in `/help` | Folder must be `ad-maker/` with `SKILL.md` directly inside, under `.claude/skills/`. Restart Claude Code. |
| "No generator detected" but you added the key | The `.env` has to be in the folder you're running Claude Code from, not in the skill folder. Check the variable is spelled `EVOLINK_API_KEY` exactly, with no quotes and no trailing spaces. |
| Face UGC came out on Seedance, not Adsora Gen | `RUNPOD_API_KEY` and `RUNPOD_VIDEO_ENDPOINT_ID` both have to be set in the skill's `config/adsoragen.env` (one alone doesn't count) and the three H3 graphs have to exist in `config/adsoragen/`. Run `node tools/adsoragen.mjs --health` — it names exactly what is missing. The cost quote says which backend each format used. |
| Generations submit fine and then hang forever | Wrong Evolink host. Media goes to `api.evolink.ai`; `direct.evolink.ai` is the text service and swallows media requests. Clear `EVOLINK_BASE_URL` to fall back to the default. |
| A "9:16" image came back square | A field-name near-miss — Evolink ignores keys it doesn't recognise rather than erroring. Images take `size`, videos take `aspect_ratio`. Tell Claude to re-check against `references/generation-adapters.md` §5. |
| Faceless render exits with no error and no voice | espeak-ng data isn't where Kokoro looks. `brew install espeak-ng`, then confirm `/opt/homebrew/share/espeak-ng-data/phontab` exists. Full table in `references/faceless-video.md`. |
| It ran past the script without asking me | It should never do that. Hands-off mode automates the *other* stops but always halts at the rebuilt-script approval. If it skipped that, tell it "stop at the REBUILD checkpoint" and report it. |
| No notification arrived on my phone | Notifications need push set up for your Claude account/device, and only fire at three points (script ready, run done, run stalled). If push isn't available in your setup, Claude says so once in chat and you fall back to opening `STATUS.md`. |
| Hands-off run stopped with "needs your call" | Something exceeded a limit — cost over your ceiling, a content block, or a rejected API key. Open `STATUS.md` for the one-line reason. Nothing was lost; the prompts are all written. Fix the cause and say "continue". |
| A whole video job was rejected for "copyrighted content" | A brand word in the prompt — iPhone, TikTok, GoPro, Reels. Seedance rejects the entire generation over one. Ask Claude to scrub brand terms and resubmit. |
| Generation cost looks wrong | Prices drift. Ask Claude to re-check the model's current price before quoting. The `budget_usd` / `budget_preapproved_usd` caps still protect you. |
| The breakdown misreads the ad | In attended mode, correct it in Stage 2. In hands-off mode the breakdown isn't shown live but it's written to `02-persuasion-dna.md` — if the rebuilt script is off because of it, send edits with your "approved" or reply "redo analysis, the mechanism is X". |
