#!/usr/bin/env node
/**
 * faceless.mjs — script in, finished vertical ad out. Single file, no build step.
 *
 * Takes a JSON file of scripts, and for each one: speaks it with a local Kokoro
 * voice, works out when every word is said, picks and packs B-roll under it,
 * burns word-timed captions, lays a music bed, and writes an MP4.
 *
 *   node faceless.mjs jobs.json
 *   node faceless.mjs jobs.json --vo-only   # just the voice: <name>.wav per job, no picture
 *
 * ── SETUP ────────────────────────────────────────────────────────────────────
 *
 *   brew install espeak-ng ffmpeg uv
 *   uv venv --python 3.11 ~/.adsora/kokoro
 *   uv pip install --python ~/.adsora/kokoro/bin/python kokoro soundfile
 *   VIRTUAL_ENV=~/.adsora/kokoro ~/.adsora/kokoro/bin/python -m spacy download en_core_web_sm
 *   brew install whisper-cpp       # caption timing, local and free (captions.mjs: heardWords)
 *   mkdir -p ~/.adsora/whisper && curl -L -o ~/.adsora/whisper/ggml-large-v3-turbo.bin \
 *     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
 *
 * Python 3.11 is not a preference. Kokoro pulls spacy -> thinc -> blis, which
 * publishes no wheels for 3.13 and fails trying to compile.
 *
 * espeak-ng is a hard requirement. The espeakng_loader wheel bundles its own
 * espeak data but espeak cannot load it on macOS — it reports a missing phontab,
 * and Kokoro then produces NO AUDIO while still exiting zero. The embedded
 * Python below repoints the loader at the homebrew tree before misaki imports,
 * which is the only moment that patch can take: misaki builds the espeak
 * singleton at import time, so setting the path afterwards is too late.
 *
 * ── JOBS FILE ────────────────────────────────────────────────────────────────
 *
 * {
 *   "outDir":    "./out",
 *   "brollDir":  "/path/to/clips",       // any folder of mp4/mov
 *   "brollPool": "./broll-pool.json",     // optional: the screened survivors (tools/broll-pool.mjs); beats the raw folder
 *   "transitions": ["fade","dissolve"],   // optional: crossfade rotation; default also has "fadeblack" (a dip to black)
 *   "hooksDir":  "/path/to/hooks",       // optional opener clips
 *   "musicDir":  "/path/to/music",       // optional; rotates across jobs
 *   "voice":     "am_adam",              // Kokoro preset — house read; af_sarah for a female read. Used when NOT cloning
 *   "speed":     1.1,                    // am_adam 1.1 / af_sarah 1.2 land ~185 wpm; omit and the house speed for the voice applies
 *   "refAudio":  "/path/to/voice-ref.wav",   // optional: clone THIS voice (Chatterbox)
 *   "voiceEngine": "kokoro",             // optional; auto → chatterbox when refAudio is set
 *   "musicVolume": 0.06,                 // linear gain under the voice
 *   "maxWords":  3,                      // caption cards: at most 3 words …
 *   "maxChars":  16,                     // … and 16 characters; a new card at any pause over `pauseBreak` (0.45s) or a sentence end
 *   "captionSize": 58,                   // caption font size at 720x1280; 50-58 is the house range
 *   "font":      "Gotham Black",         // optional; the house face is the default when installed, Arial Black otherwise
 *   "python":    "~/.adsora/kokoro/bin/python",                 // Kokoro venv (house path)
 *   "chatterboxPython": "~/.adsora/vc-chatterbox/bin/python",   // clone venv
 *   "jobs": [ { "name": "ad-01", "script": "...", "hook": "opener.mp4",
 *              "refAudio": "/path/to/other-voice.wav" } ] // per-job ref beats the global one
 * }
 *
 * ── TWO VOICE ENGINES, chosen per job ────────────────────────────────────────
 *
 * Kokoro (default) — 54 fixed presets, no cloning, fast on MPS. Used whenever no
 * refAudio is in play. af_ American female, am_ American male, bf_/bm_ British.
 * The house read is am_adam at 1.1 (af_sarah at 1.2 for female): a faceless ad
 * has nobody on screen, so there is nothing to clone from and it never clones
 * unless a refAudio is supplied. See references/house-defaults.md.
 *
 * Chatterbox (clone) — kicks in automatically the moment a job or the config
 * carries "refAudio": a clean ~7-12s WAV of the target voice, which it clones
 * zero-shot. So cloning happens ONLY where a reference voice is supplied;
 * every other job stays on Kokoro. Chatterbox ignores "speed" and has no accent
 * prompt; tune it with "exaggeration" (0.5), "cfgWeight" (0.5), "temperature"
 * (0.8) at the config level. Set "voiceEngine" explicitly to force one engine.
 *
 *   Clone-venv setup (Apple Silicon):
 *     uv venv --python 3.11 ~/.adsora/vc-chatterbox
 *     uv pip install --python ~/.adsora/vc-chatterbox/bin/python chatterbox-tts
 *   Make the ref with Demucs (isolate the voice off any music bed) → mono 24kHz.
 *   Zero-shot takes glitch ~1 in 4 (a swallowed word); just rerun that job.
 */

import { readFile, writeFile, mkdir, readdir, rm, copyFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile, spawn } from "node:child_process";
import { join, basename, extname, resolve, dirname } from "node:path";
import { houseFont, fontsDir, chunkCues, applyCorrections, whisperStatus, heardWords, MAX_WORDS, MAX_CHARS, PAUSE_BREAK } from "./captions.mjs";
import { tmpdir, homedir } from "node:os";

/* ── the voice: Kokoro, embedded so this stays one file ──────────────────── */

const KOKORO_PY = `
import argparse, json, os, sys, warnings
warnings.filterwarnings("ignore")

# Must run BEFORE misaki imports: it hands espeakng_loader.get_data_path()
# straight to phonemizer, which builds the espeak singleton there and then.
def fix_espeak():
    try:
        import espeakng_loader
    except Exception:
        return
    for d in ("/opt/homebrew/share/espeak-ng-data",
              "/usr/local/share/espeak-ng-data",
              "/usr/share/espeak-ng-data"):
        if os.path.exists(os.path.join(d, "phontab")):
            espeakng_loader.get_data_path = lambda _d=d: _d
            return

ap = argparse.ArgumentParser()
ap.add_argument("--text-file", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--voice", default="am_adam")
ap.add_argument("--speed", type=float, default=1.0)
ap.add_argument("--lang", default="a")
a = ap.parse_args()

text = open(a.text_file, encoding="utf-8").read().strip()
if not text:
    print(json.dumps({"ok": False, "error": "empty script"})); sys.exit(1)

fix_espeak()
import numpy as np, soundfile as sf
from kokoro import KPipeline

pipe = KPipeline(lang_code=a.lang)
chunks = []
for r in pipe(text, voice=a.voice, speed=a.speed):
    au = getattr(r, "audio", None)
    if au is None and isinstance(r, tuple): au = r[-1]
    if au is None: continue
    arr = au.detach().cpu().numpy() if hasattr(au, "detach") else np.asarray(au)
    chunks.append(np.asarray(arr, dtype=np.float32).reshape(-1))

if not chunks:
    print(json.dumps({"ok": False, "error": "kokoro produced no audio"})); sys.exit(1)

wav = np.concatenate(chunks); sr = 24000
sf.write(a.out, wav, sr)
print(json.dumps({"ok": True, "durationSec": len(wav)/sr, "voice": a.voice}))
`;

/* ── the clone: Chatterbox, same one-file-embedded shape as Kokoro ────────── */

const CHATTERBOX_PY = `
import argparse, json, os, re, sys, warnings
warnings.filterwarnings("ignore")

ap = argparse.ArgumentParser()
ap.add_argument("--text-file", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--ref", required=True)                 # voice to clone (audio_prompt_path)
ap.add_argument("--exaggeration", type=float, default=0.5)
ap.add_argument("--cfg", type=float, default=0.5)
ap.add_argument("--temperature", type=float, default=0.8)
ap.add_argument("--device", default="mps")
a = ap.parse_args()

text = open(a.text_file, encoding="utf-8").read().strip()
if not text:
    print(json.dumps({"ok": False, "error": "empty script"})); sys.exit(1)
if not os.path.exists(a.ref):
    print(json.dumps({"ok": False, "error": "reference audio not found: " + a.ref})); sys.exit(1)

import torch, torchaudio
from chatterbox.tts import ChatterboxTTS

dev = a.device
if dev == "mps" and not (hasattr(torch.backends, "mps") and torch.backends.mps.is_available()):
    dev = "cpu"
model = ChatterboxTTS.from_pretrained(device=dev)
sr = model.sr

# Chatterbox is happiest on short spans; split at sentence boundaries (~220 chars).
sents = re.split(r'(?<=[.!?])\\s+', text)
chunks, cur = [], ""
for s in sents:
    if len(cur) + len(s) < 220:
        cur = (cur + " " + s).strip()
    else:
        chunks.append(cur); cur = s
if cur:
    chunks.append(cur)
if not chunks:
    chunks = [text]

gap = torch.zeros(1, int(sr * 0.28))
wavs = []
for c in chunks:
    w = model.generate(c, audio_prompt_path=a.ref,
                       exaggeration=a.exaggeration, cfg_weight=a.cfg, temperature=a.temperature)
    if w.dim() == 1:
        w = w.unsqueeze(0)
    wavs.append(w.detach().cpu())
    wavs.append(gap)

audio = torch.cat(wavs, dim=-1)
torchaudio.save(a.out, audio, sr)
print(json.dumps({"ok": True, "durationSec": audio.shape[-1]/sr, "engine": "chatterbox", "device": dev}))
`;

/* ── small helpers ───────────────────────────────────────────────────────── */

const sh = (cmd, args, timeoutMs = 900_000) =>
  new Promise((res) =>
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 64 << 20 }, (err, stdout, stderr) =>
      res({ ok: !err, stdout: String(stdout ?? ""), stderr: String(stderr ?? "") })));

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

function ff(args) {
  // stdout ignored and stdin closed: with the default pipes, anything ffmpeg
  // writes fills a 64KB OS buffer nothing drains and the process blocks forever
  // at 0% CPU — no error, no exit, no progress.
  return new Promise((res, rej) => {
    const p = spawn(FFMPEG, ["-nostdin", "-hide_banner", "-loglevel", "error", ...args],
      { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; if (err.length > 8000) err = err.slice(-8000); });
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg ${code}: ${err.slice(-500)}`))));
  });
}

async function duration(file) {
  const r = await sh(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], 60_000);
  const n = Number(r.stdout.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const expand = (p) => (p?.startsWith("~") ? join(homedir(), p.slice(1)) : p);

// The house read. Measured: these speeds land ~185 wpm, the direct-response
// band. A faceless ad has nothing on screen to clone from, so the preset is
// the default and cloning is opt-in via refAudio. See references/house-defaults.md.
const HOUSE_VOICE = "am_adam";
const HOUSE_SPEED = { am_adam: 1.1, af_sarah: 1.2 };

// Kokoro is the default voice engine, and it lives in its own venv (spacy →
// thinc → blis publish no 3.13 wheels, so it needs Python 3.11 — the system
// Python won't do). The skill ships the render code but not the venv, so a fresh
// machine has everything here except a voice. Check for the venv up front and
// fail with the exact install steps, rather than letting Kokoro exit zero with
// NO AUDIO deep in the job loop. Cloning (refAudio → Chatterbox) is the other
// way to get a voice and doesn't touch this venv.
const KOKORO_SETUP = [
  "brew install espeak-ng ffmpeg uv",
  "uv venv --python 3.11 ~/.adsora/kokoro",
  "uv pip install --python ~/.adsora/kokoro/bin/python kokoro soundfile",
  "VIRTUAL_ENV=~/.adsora/kokoro ~/.adsora/kokoro/bin/python -m spacy download en_core_web_sm",
].join("\n  ");
function kokoroStatus(pythonPath) {
  if (existsSync(pythonPath)) return { ok: true, python: pythonPath };
  return { ok: false, reason:
    `Kokoro is not installed — the voice venv is missing at ${pythonPath}.\n` +
    `Kokoro is the default (house ${HOUSE_VOICE}) voice for faceless ads. Install it once:\n\n  ${KOKORO_SETUP}\n\n` +
    `Python 3.11 is required: Kokoro pulls spacy → thinc → blis, which has no 3.13 wheels. ` +
    `Alternatively, clone a voice by setting "refAudio" on the job, which speaks through Chatterbox and skips this venv.` };
}

// A screened pool (tools/broll-pool.mjs) lists the survivors as { file } entries,
// relative to the folder they were screened in (or absolute).
async function poolFiles(poolPath, baseDir) {
  const p = resolve(expand(poolPath));
  const parsed = JSON.parse(await readFile(p, "utf8"));
  const items = Array.isArray(parsed) ? parsed : parsed.clips ?? [];
  const base = baseDir ? expand(baseDir) : dirname(p);
  return items.map((e) => { const f = typeof e === "string" ? e : e.file; return f.startsWith("/") ? f : f.startsWith("~") ? expand(f) : join(base, f); });
}

// Seeded so a job always draws the same footage order — a rerun reproduces the
// edit instead of quietly becoming a different ad. The seed is the job name up
// to "__", so <script>__<hook> jobs share one montage and only the opener
// differs: one body, many hooks, which is what makes it a hook test.
function shuffle(arr, seed) {
  const a = arr.slice();
  let s = seed >>> 0 || 1;
  const next = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ── captions: our own audio is transcribed locally (captions.mjs: heardWords),
   and the times are mapped onto our own written words ─────────────────────── */

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Align written words to heard words by edit distance.
 *
 * Not a zip. A transcriber writes "2026" where the script says "twenty
 * twenty-six", splits contractions and drops filler, so pairing word n to word n
 * drifts by one and never recovers — every caption after it is wrong. Written
 * words with no heard match get their timing interpolated from the anchors
 * either side, so the caption text is always what was written and only the
 * timing is heard.
 */
function align(written, heard, total) {
  const m = written.length, n = heard.length;
  if (!m) return [];
  const even = () => written.map((t, i) => ({ text: t, start: (i / m) * total, end: ((i + 1) / m) * total }));
  if (!n) return even();

  const w = written.map(norm), h = heard.map((x) => norm(x.text));
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j - 1] + (w[i - 1] && w[i - 1] === h[j - 1] ? 0 : 1), dp[i - 1][j] + 1, dp[i][j - 1] + 1);

  const out = written.map((t) => ({ text: t, start: NaN, end: NaN }));
  let i = m, j = n;
  while (i > 0 && j > 0) {
    const exact = w[i - 1] && w[i - 1] === h[j - 1];
    if (dp[i][j] === dp[i - 1][j - 1] + (exact ? 0 : 1)) {
      if (exact) { out[i - 1].start = heard[j - 1].start; out[i - 1].end = heard[j - 1].end; }
      i--; j--;
    } else if (dp[i][j] === dp[i - 1][j] + 1) i--;
    else j--;
  }

  const anchors = out.map((o, k) => (Number.isFinite(o.start) ? k : -1)).filter((k) => k >= 0);
  if (!anchors.length) return even();
  const first = anchors[0], last = anchors[anchors.length - 1];
  for (let k = first - 1; k >= 0; k--) { out[k].end = out[k + 1].start; out[k].start = Math.max(0, out[k].end - 0.25); }
  for (let a = 0; a < anchors.length - 1; a++) {
    const s = anchors[a], e = anchors[a + 1];
    if (e - s <= 1) continue;
    const from = out[s].end, step = (out[e].start - from) / (e - s);
    for (let k = s + 1; k < e; k++) { out[k].start = from + step * (k - s - 1); out[k].end = from + step * (k - s); }
  }
  for (let k = last + 1; k < m; k++) { out[k].start = out[k - 1].end; out[k].end = out[k].start + 0.25; }
  for (let k = 0; k < m; k++) {
    if (!Number.isFinite(out[k].start)) out[k].start = k ? out[k - 1].end : 0;
    if (!Number.isFinite(out[k].end) || out[k].end <= out[k].start) out[k].end = out[k].start + 0.18;
    if (k && out[k].start < out[k - 1].end) out[k].start = out[k - 1].end;
  }
  return out;
}

const ts = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
};

function buildAss(list, { font = houseFont(), size = 58, w = 720, h = 1280 } = {}) {
  const esc = (t) => t.replace(/[{}\\]/g, "").replace(/\n/g, " ").toUpperCase();
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${w}
PlayResY: ${h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,${font},${size},&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,5,2,2,50,50,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${list.map((c) => `Dialogue: 0,${ts(c.start)},${ts(c.end)},Cap,,0,0,0,,${esc(c.text)}`).join("\n")}
`;
}

/* ── picture: pack clips under the voice, then crossfade them together ────── */

const MIN_CLIP = 1.4;

function pack(pool, hook, target, hookSec, slotSec) {
  const segs = [];
  let filled = 0;
  if (hook?.dur > 0) {
    const d = Math.min(hookSec, hook.dur);
    segs.push({ file: hook.path, start: 0, dur: +d.toFixed(3) });
    filled += d;
  }
  let i = 0;
  while (filled < target && pool.length) {
    const c = pool[i % pool.length]; i++;
    if (c.dur < MIN_CLIP) continue;
    const d = Math.max(MIN_CLIP, Math.min(slotSec, c.dur, target - filled + 0.4));
    segs.push({ file: c.path, start: c.dur - d > 0.6 ? 0.5 : 0, dur: +d.toFixed(3) });
    filled += d;
    if (i > pool.length * 6) break;
  }
  return segs;
}

const TRANSITIONS = ["fade", "fadeblack", "smoothleft", "smoothright", "circleopen", "dissolve"];

/**
 * Encode every "hold" (the steady, non-transitioning part of a clip) and
 * every crossfade transition exactly once, then stitch them together with a
 * lossless stream-copy concat.
 *
 * The previous approach folded clips into a single growing accumulator,
 * re-encoding that whole accumulator (via the xfade filter) at every step —
 * O(n^2) total re-encoding, so a clip near the start of a long chain (a
 * 40+ scene ad, easily reached by a long-form narrative script) could pass
 * through libx264 30+ more times than a clip near the end. That compounding
 * is not visible as ordinary bitrate softening (confirmed: neither a much
 * lower crf nor yuv444p intermediates fixed it, and it reproduced with the
 * plain "fade" transition alone) — but it is real and visible, a fine
 * moire/ghosting smear, worse the more regenerations a piece of content
 * accumulates. Each hold and each transition is now a leaf encode with
 * exactly one generation of loss, independent of how many scenes the ad has.
 */
async function assemble(segs, work, { frame, fps, variation, transitions }) {
  // `transitions` in the jobs file overrides the rotation (e.g. drop "fadeblack" for a
  // fast direct-response read, where a dip to black reads as a broken cut).
  const TR = Array.isArray(transitions) && transitions.length ? transitions : TRANSITIONS;
  const [W, H] = frame;
  const fill = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`;
  const T = Math.min(0.5, ...segs.map((s) => s.dur / 3));
  const n = segs.length;
  const enc1 = (inputArgs, outFile) => ff([...inputArgs, "-an", "-vf", `${fill},fps=${fps}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", outFile]);
  // The last clip's requested read window is padded by the total overlap the
  // transitions add back (see below) — routinely more than that one short
  // b-roll clip actually has left on disk (these are screened, pre-cut
  // clips: probing shows most sit at exactly their nominal length, no slack
  // past it). Rather than let ffmpeg silently truncate — which starves the
  // final mux's `-t <adLen>` trim of real frames right at the point it needs
  // them, so seeking near the end of the finished ad comes up empty — freeze
  // the last decoded frame to make up any shortfall.
  const ensureDur = async (file, wantDur) => {
    const short = wantDur - (await duration(file));
    if (short <= 0.05) return;
    const padded = `${file}.pad.mp4`;
    await ff(["-i", file, "-vf", `tpad=stop_mode=clone:stop_duration=${short.toFixed(3)}`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", padded]);
    await rm(file, { force: true });
    await rename(padded, file);
  };
  const pieces = [];

  for (let i = 0; i < n; i++) {
    const s = segs[i];
    const leadT = i > 0 ? T : 0;
    const trailT = i < n - 1 ? T : 0;
    // Pad the final clip by the total overlap the transitions will add back.
    const totalDur = s.dur + (i === n - 1 ? T * (n - 1) : 0);

    const coreDur = totalDur - leadT - trailT;
    if (coreDur > 0.02) {
      const hold = join(work, `hold${i}.mp4`);
      await enc1(["-ss", String(s.start + leadT), "-i", s.file, "-t", String(coreDur)], hold);
      await ensureDur(hold, coreDur);
      pieces.push(hold);
    }

    if (i < n - 1) {
      const next = segs[i + 1];
      const tail = join(work, `tail${i}.mp4`), head = join(work, `head${i}.mp4`);
      const tailSs = Math.max(0, s.start + totalDur - T);
      await enc1(["-ss", String(tailSs), "-i", s.file, "-t", String(T)], tail);
      await enc1(["-ss", String(next.start), "-i", next.file, "-t", String(T)], head);
      const tr = TR[(i + variation) % TR.length];
      const trans = join(work, `trans${i}.mp4`);
      await ff(["-i", tail, "-i", head, "-filter_complex",
        `[0:v][1:v]xfade=transition=${tr}:duration=${T.toFixed(3)}:offset=0,format=yuv420p[v]`,
        "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", trans]);
      await rm(tail, { force: true }); await rm(head, { force: true });
      pieces.push(trans);
    }
  }

  // Re-encode this last concat pass rather than stream-copying: the xfade
  // pieces (which pass through an extra `format=yuv420p`) end up with subtly
  // different color-range metadata than the plain scale/crop hold pieces, and
  // -c copy concat doesn't tolerate that mismatch — it plays, but a strict
  // decoder chokes exactly at the piece boundaries (ffprobe/mjpeg included).
  // This is one re-encode of the whole video, not per-fold, so it doesn't
  // reintroduce the compounding loss this rewrite exists to avoid.
  const listFile = join(work, "concat_list.txt");
  await writeFile(listFile, pieces.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
  const final = join(work, "assembled.mp4");
  await ff(["-f", "concat", "-safe", "0", "-i", listFile,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", final]);
  for (const p of pieces) await rm(p, { force: true });
  await rm(listFile, { force: true });
  return final;
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) { console.error("usage: node faceless.mjs <jobs.json> [--vo-only]"); process.exit(1); }
  const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
  // --vo-only: synthesize each job's voice to outDir/<name>.wav and stop. No
  // b-roll, no captions, no whisper — tools/assemble.mjs lays the wav under its own
  // picture (a looped background, a still) and captions it there.
  const voOnly = process.argv.includes("--vo-only") || cfg.voOnly === true;

  const whisper = whisperStatus(cfg.whisperModel);      // local whisper.cpp for caption timing; no key, no spend
  if (!whisper.ok && !voOnly) throw new Error(`${whisper.reason} — needed for caption timing`);
  if (whisper.ok && !voOnly) console.log(`caption timing: whisper.cpp ${basename(whisper.model)}${whisper.dtw ? " +dtw" : ""}`);
  const python = expand(cfg.python) || join(homedir(), ".adsora/kokoro/bin/python");
  const chatterboxPython = expand(cfg.chatterboxPython) || join(homedir(), ".adsora/vc-chatterbox/bin/python");

  // Preflight: any job that speaks with Kokoro (the default engine, i.e. no
  // refAudio) needs the Kokoro venv installed first. Fail fast with the install
  // steps rather than probing clips and then dying job-by-job with "no audio".
  const engineOf = (job) => {
    const ref = expand(job.refAudio ?? cfg.refAudio);
    return (job.voiceEngine ?? cfg.voiceEngine ?? (ref ? "chatterbox" : "kokoro")).toLowerCase();
  };
  if ((cfg.jobs ?? []).some((job) => engineOf(job) === "kokoro")) {
    const k = kokoroStatus(python);
    if (!k.ok) throw new Error(k.reason);
  }

  const outDir = resolve(expand(cfg.outDir) || "./out");
  const work = join(outDir, ".work");
  await mkdir(work, { recursive: true });

  const pyFile = join(work, "_kokoro.py");
  await writeFile(pyFile, KOKORO_PY, "utf8");
  const cbFile = join(work, "_chatterbox.py");
  await writeFile(cbFile, CHATTERBOX_PY, "utf8");

  const frame = (cfg.aspect === "16:9") ? [1280, 720] : (cfg.aspect === "1:1") ? [1080, 1080] : [720, 1280];
  const fps = cfg.fps ?? 30;
  const hookSec = cfg.hookSec ?? 2.6;
  const slotSec = cfg.slotSec ?? 3.2;
  const musicVol = cfg.musicVolume ?? 0.06;

  const isVid = (f) => /\.(mp4|mov|m4v|webm)$/i.test(f);
  const list = async (d) => (d ? (await readdir(expand(d))).filter(isVid).map((f) => join(expand(d), f)) : []);
  const broll = cfg.brollPool ? await poolFiles(cfg.brollPool, cfg.brollDir) : await list(cfg.brollDir);
  const capOpts = { maxWords: cfg.maxWords ?? cfg.wordsPerCue ?? MAX_WORDS, maxChars: cfg.maxChars ?? MAX_CHARS, pauseBreak: cfg.pauseBreak ?? PAUSE_BREAK };
  const font = cfg.font ?? houseFont();
  const fontsOpt = fontsDir() ? `:fontsdir='${fontsDir().replace(/([:'\\])/g, "\\$1")}'` : "";
  if (houseFont() !== "Gotham Black") console.warn(`captions in ${font} — the house face Gotham Black is not installed on this machine`);
  else if (font !== "Gotham Black") console.log(`captions in ${font} (jobs file override; the house face is Gotham Black)`);
  const hooks = await list(cfg.hooksDir);
  const music = cfg.musicDir
    ? (await readdir(expand(cfg.musicDir))).filter((f) => /\.(mp3|m4a|wav|aac)$/i.test(f)).sort()
        .map((f) => join(expand(cfg.musicDir), f))
    : [];
  if (!broll.length && !voOnly) throw new Error(`no clips found in ${cfg.brollPool ?? cfg.brollDir}`);

  process.stdout.write(`probing ${broll.length + hooks.length} clips… `);
  const durs = new Map();
  const q = [...broll, ...hooks];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (;;) { const p = q.shift(); if (!p) return; durs.set(p, await duration(p)); }
  }));
  const pool = broll.filter((p) => (durs.get(p) ?? 0) >= MIN_CLIP);
  console.log(`${pool.length} usable, ${hooks.length} hooks, ${music.length} music beds`);

  // One body per script: jobs named <script>__<hook> share a seed, so they draw
  // the same footage, the same transitions and the same bed; only the opener
  // differs. Beds still rotate across *different* scripts, in job order.
  const seedOf = (job) => String(job.seed ?? String(job.name).split("__")[0]);
  const bodies = [...new Set((cfg.jobs ?? []).map(seedOf))];

  const results = [];
  for (const [idx, job] of (cfg.jobs ?? []).entries()) {
    const seedStr = seedOf(job), seed = hash(seedStr), body = bodies.indexOf(seedStr);
    const tag = `[${idx + 1}/${cfg.jobs.length}] ${job.name}`;
    try {
      // 1. voice — clone with Chatterbox when a reference voice is supplied,
      //    otherwise speak it with a Kokoro preset. Cloning is opt-in per job:
      //    a job.refAudio (or a global cfg.refAudio) is what flips the engine.
      const spoken = String(job.script ?? "").replace(/\s+/g, " ").trim();
      if (!spoken) throw new Error("empty script");
      const txt = join(work, `${job.name}.txt`), wav = join(work, `${job.name}.wav`);
      await writeFile(txt, spoken, "utf8");

      const ref = expand(job.refAudio ?? cfg.refAudio);
      const engine = (job.voiceEngine ?? cfg.voiceEngine ?? (ref ? "chatterbox" : "kokoro")).toLowerCase();
      const voice = job.voice ?? cfg.voice ?? HOUSE_VOICE;
      const speed = job.speed ?? cfg.speed ?? HOUSE_SPEED[voice] ?? 1.0;

      let r;
      if (engine === "chatterbox") {
        if (!ref) throw new Error("voiceEngine 'chatterbox' needs a refAudio (the voice to clone)");
        r = await sh(chatterboxPython, [cbFile, "--text-file", txt, "--out", wav, "--ref", ref,
          "--exaggeration", String(cfg.exaggeration ?? 0.5), "--cfg", String(cfg.cfgWeight ?? 0.5),
          "--temperature", String(cfg.temperature ?? 0.8)]);
      } else {
        r = await sh(python, [pyFile, "--text-file", txt, "--out", wav, "--voice", voice, "--speed", String(speed)]);
      }
      const line = r.stdout.split("\n").reverse().find((l) => l.trim().startsWith("{"));
      const meta = line ? JSON.parse(line) : null;
      if (!meta?.ok) throw new Error(`${engine}: ${meta?.error ?? (r.stderr.slice(-200) || "no output")}`);
      const voSec = +meta.durationSec || (await duration(wav));
      const voiceLabel = engine === "chatterbox" ? `clone:${basename(ref)}` : `${voice}@${speed}`;
      console.log(`${tag} — ${voSec.toFixed(1)}s voiceover (${engine} · ${voiceLabel})`);
      if (voOnly) {
        const dest = join(outDir, `${job.name}.wav`);
        await copyFile(wav, dest);
        console.log(`${tag} ✓ ${basename(dest)} (voice only)`);
        results.push({ name: job.name, wav: dest, voSec: +voSec.toFixed(2), engine, voice: voiceLabel, ok: true });
        continue;
      }

      // 2. captions
      const words = align(spoken.split(/\s+/).filter(Boolean), applyCorrections(await heardWords(wav, whisper)), voSec);
      await writeFile(join(work, `${job.name}.ass`), buildAss(chunkCues(words, capOpts), { w: frame[0], h: frame[1], font, size: cfg.captionSize ?? 58 }), "utf8");

      // 3. picture
      const hookPath = job.hook ? join(expand(cfg.hooksDir), job.hook) : null;
      const hookDur = hookPath ? durs.get(hookPath) ?? 0 : 0;
      const segs = pack(
        shuffle(pool, seed).map((p) => ({ path: p, dur: durs.get(p) ?? 0 })),
        hookDur ? { path: hookPath, dur: hookDur } : null,
        voSec + 0.8, hookSec, slotSec);
      console.log(`${tag} — ${segs.length} scenes`);
      const silent = await assemble(segs, work, { frame, fps, variation: body, transitions: job.transitions ?? cfg.transitions });

      // 4. audio + captions burned in one pass
      const adLen = voSec + 0.8;
      const bed = music.length ? music[body % music.length] : null;
      const args = ["-i", silent, "-i", wav];
      if (bed) args.push("-i", bed);
      const fadeOut = Math.max(0.1, adLen - 0.8);
      // normalize=0 keeps each lane at its own level; without it amix halves both.
      const audio = bed
        ? `[1:a]aresample=44100,apad=whole_dur=${adLen.toFixed(2)},atrim=0:${adLen.toFixed(2)}[v1];` +
          `[2:a]aresample=44100,aloop=loop=-1:size=2147483647,atrim=0:${adLen.toFixed(2)},volume=${musicVol},` +
          `afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOut.toFixed(2)}:d=0.8[v2];` +
          `[v1][v2]amix=inputs=2:duration=first:normalize=0[a]`
        : `[1:a]aresample=44100,apad=whole_dur=${adLen.toFixed(2)},atrim=0:${adLen.toFixed(2)}[a]`;
      const subs = join(work, `${job.name}.ass`).replace(/([:'\\])/g, "\\$1");
      const dest = join(outDir, `${job.name}.mp4`);
      await ff([...args, "-filter_complex", `${audio};[0:v]subtitles='${subs}'${fontsOpt}[v]`,
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-t", String(adLen), "-y", dest]);
      await rm(silent, { force: true });

      console.log(`${tag} ✓ ${basename(dest)}`);
      // The manifest records which clips went under the voice, so the run log can say what was screened and used.
      results.push({ name: job.name, file: dest, scenes: segs.length, voSec: +voSec.toFixed(2), engine, voice: voiceLabel, seed: seedStr, captionTiming: "local",
        clips: segs.map((sg) => ({ file: basename(sg.file), start: sg.start, dur: sg.dur })), ok: true });
    } catch (e) {
      console.error(`${tag} ✗ ${e.message}`);
      results.push({ name: job.name, ok: false, error: e.message });
    }
  }

  await writeFile(join(outDir, "manifest.json"), JSON.stringify(results, null, 2));
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} rendered into ${outDir}`);
  if (!ok) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
