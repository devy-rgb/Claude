#!/usr/bin/env node
/**
 * adsoragen.mjs — Adsora Gen from the skill: our MiniMax H3 weights on our own
 * RunPod GPU, driven by API from this machine, every clip saved locally.
 * Single file, no build step, nothing beyond Node 18+ (plus ffmpeg for the
 * avatar path, which the edit needs anyway).
 *
 *   node tools/adsoragen.mjs jobs.json                 # submit every job, poll, download
 *   node tools/adsoragen.mjs jobs.json --plan          # validate, build graphs, frames, cost — no spend
 *   node tools/adsoragen.mjs --health                  # keys, graphs, endpoints: are we live?
 *   node tools/adsoragen.mjs --cancel runpod:<endpointId>:<jobId>
 *   node tools/adsoragen.mjs --import-env <pulled.env> # fill config/adsoragen.env + graphs from a dotenv
 *
 * Same contract as the Adsora studio's own client (webchat-vercel/
 * lib/marketing/video/runpod.ts, comfy-workflow.ts, avatar-video.ts), reduced
 * to a CLI: worker-comfyui on RunPod serverless, `{ input: { workflow, images } }`
 * in, an mp4 out, job ids namespaced `runpod:<endpointId>:<jobId>` so a poll
 * always reaches the machine that took the work. Hard rule 15: never the web
 * app, never a browser tab, never a clip left only on the server.
 *
 * ── KEYS (read in this order; first non-empty wins; "[SENSITIVE]" is skipped) ──
 *
 *   1. <skill>/config/adsoragen.env          ← the skill's own key file. Fill this one.
 *   2. the process environment
 *   3. ./.env in the folder you run from
 *   4. ~/Documents/webchat-vercel/.env.local, ~/Documents/Adsora OS/.env
 *
 *   RUNPOD_API_KEY                 required. Bearer token for api.runpod.ai (starts "rpa_").
 *   RUNPOD_VIDEO_ENDPOINT_ID       required. The serverless endpoint running worker-comfyui + H3.
 *   RUNPOD_VIDEO_ENDPOINT_ID_2/_3  optional. Fallbacks tried when the primary refuses a submit.
 *   RUNPOD_GPU_HOURLY              optional, default 3.49. Turns executionTime into real dollars.
 *   RUNPOD_S2V_STEPS               optional, default 16. Sampling steps for avatar (talking) jobs.
 *   RUNPOD_VIDEO_STEPS             optional, default 16. Sampling steps for t2v / i2v jobs.
 *   RUNPOD_VIDEO_ETA_SEC           optional, default 150. Cold-start ETA printed while waiting.
 *
 * ── GRAPHS (the ComfyUI "Export (API)" JSON the worker runs; data, not code) ──
 *
 *   <skill>/config/adsoragen/h3-t2v.json        or env ADSORA_WORKFLOW_H3_T2V
 *   <skill>/config/adsoragen/h3-i2v.json        or env ADSORA_WORKFLOW_H3_I2V
 *   <skill>/config/adsoragen/h3-s2v.json        or env ADSORA_WORKFLOW_H3        (avatar: face + voice)
 *   <skill>/config/adsoragen/h3-s2v-chain.json  or env ADSORA_WORKFLOW_H3_CHAIN  (avatar clip 2..N; falls back to s2v)
 *
 *   Each graph carries the placeholders __ADSORA_PROMPT__ __ADSORA_NEGATIVE__
 *   __ADSORA_SEED__ __ADSORA_STEPS__ __ADSORA_WIDTH__ __ADSORA_HEIGHT__
 *   __ADSORA_FRAMES__ and, where the graph takes them, __ADSORA_IMAGE__
 *   __ADSORA_AUDIO__ __ADSORA_PREV__. This tool only substitutes; it never
 *   authors a graph, because a near-miss node name does not error — it renders
 *   the wrong thing and bills for it.
 *
 * ── JOBS FILE ────────────────────────────────────────────────────────────────
 *
 * {
 *   "outDir":  "./ad-remix-runs/<slug>/05-assets/ugc-yapper",
 *   "aspect":  "9:16",              // 9:16 · 1:1 · 16:9
 *   "quality": "480p",              // 480p (480×832) · 720p (704×1280) — H3 snaps to /32
 *   "seed":    123456,              // optional; shared by every job. Chained clips MUST share one.
 *   "steps":   16,                  // optional override of the env defaults
 *   "accent":  "",                  // only when the run names a non-American accent (hard rule 17)
 *   "chain":   false,               // true → jobs run in order; each avatar clip continues the last shot
 *   "concurrency": 2,               // parallel jobs when not chaining (= the endpoint's max workers)
 *   "jobs": [
 *     { "name": "clip-1", "mode": "avatar",              // face + OUR voice → lip-synced clip
 *       "image": "/abs/portrait.png", "audio": "/abs/clip-1.wav",
 *       "prompt": "phone-held framing in a bright kitchen, natural hand gestures" },
 *     { "name": "clip-2", "mode": "i2v", "image": "/abs/frame.png",
 *       "prompt": "...", "seconds": 6 },                  // picture from a start frame, H3's own audio
 *     { "name": "clip-3", "mode": "t2v", "prompt": "...", "seconds": 5 }
 *   ]
 * }
 *
 *   mode      avatar | i2v | t2v. Or "model": adsora-avatar-2.0 | adsora-gen-2.0-i2v | adsora-gen-2.0.
 *             Omitted: audio present → avatar; image present → i2v; else t2v.
 *   seconds   t2v/i2v only, 5.2–15.08. Avatar clips take their length from the audio.
 *   audio     avatar: the voice to lip-sync (WAV/MP3; tools/faceless.mjs --vo-only makes one per line).
 *             H3 RE-SYNTHESIZES the voice it is given (envelope correlation ≈0.48), so by default
 *             this tool muxes your exact audio back over H3's picture. "keepModelAudio": true
 *             keeps H3's own track instead. The raw model output is kept as <name>.h3.mp4 either way.
 *   out       optional explicit output path; default <outDir>/<name>.mp4.
 *   seed / steps / quality / aspect / accent  per-job overrides.
 *
 * Writes <outDir>/<name>.mp4 per job and <jobs>.results.json (job id, endpoint,
 * seed, frames, executionTime, real cost, path, error). Ctrl-C cancels every
 * in-flight job before exiting — an abandoned job still runs and still bills.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

// ── paths ─────────────────────────────────────────────────────────────────────
const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_DIR = join(SKILL_DIR, "config");
const KEY_FILE = join(CONFIG_DIR, "adsoragen.env");
const GRAPH_DIR = join(CONFIG_DIR, "adsoragen");
const HOME = homedir();
const expand = (p) => (typeof p === "string" ? p.replace(/^~(?=$|\/)/, HOME) : p);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

// ── env: skill key file → process.env → ./.env → house files ─────────────────
const ENV_FILES = [
  KEY_FILE,
  resolve(process.cwd(), ".env"),
  join(HOME, "Documents/webchat-vercel/.env.local"),
  join(HOME, "Documents/Adsora OS/.env"),
];
/** dotenv parser: KEY=v · KEY="v with \" \n escapes, may span lines" · KEY='literal' · export KEY=v */
function parseDotenv(text) {
  const out = {};
  const lines = text.split("\n");
  for (let n = 0; n < lines.length; n++) {
    const t = lines[n].trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim().replace(/^export\s+/, "");
    let v = t.slice(i + 1).trim();
    if (v.startsWith('"')) {
      // consume continuation lines until the closing quote
      while (!(v.length >= 2 && /[^\\]"$/.test(v)) && n + 1 < lines.length) v += "\n" + lines[++n];
      v = v.slice(1, v.endsWith('"') ? -1 : undefined).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (v.startsWith("'") && v.endsWith("'") && v.length >= 2) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}
const envCache = new Map();
function envFile(file) {
  if (envCache.has(file)) return envCache.get(file);
  let out = {};
  try { out = parseDotenv(readFileSync(file, "utf8")); } catch { /* absent is fine */ }
  for (const k of Object.keys(out)) if (!out[k] || out[k].includes("SENSITIVE")) delete out[k];
  envCache.set(file, out);
  return out;
}
function env(k) {
  const own = envFile(KEY_FILE)[k];
  if (own) return own;
  const p = process.env[k];
  if (p && !p.includes("SENSITIVE")) return p;
  for (const f of ENV_FILES.slice(1)) { const v = envFile(f)[k]; if (v) return v; }
  return "";
}
function envSource(k) {
  if (envFile(KEY_FILE)[k]) return "config/adsoragen.env";
  if (process.env[k] && !process.env[k].includes("SENSITIVE")) return "process.env";
  for (const f of ENV_FILES.slice(1)) if (envFile(f)[k]) return f.replace(HOME, "~");
  return "";
}
const num = (k, d) => { const v = Number(env(k)); return Number.isFinite(v) && v > 0 ? v : d; };

const API_KEY = env("RUNPOD_API_KEY");
const ENDPOINTS = [...new Set([env("RUNPOD_VIDEO_ENDPOINT_ID"), env("RUNPOD_VIDEO_ENDPOINT_ID_2"), env("RUNPOD_VIDEO_ENDPOINT_ID_3")].filter(Boolean))];
const GPU_HOURLY = num("RUNPOD_GPU_HOURLY", 3.49);
const S2V_STEPS = num("RUNPOD_S2V_STEPS", 16);
const VIDEO_STEPS = num("RUNPOD_VIDEO_STEPS", 16);
const ETA_SEC = num("RUNPOD_VIDEO_ETA_SEC", 150);
const api = (endpoint) => `https://api.runpod.ai/v2/${endpoint}`;
const authHeaders = () => ({ "content-type": "application/json", Authorization: `Bearer ${API_KEY}` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── model facts (MiniMax H3) ──────────────────────────────────────────────────
// 24 fps; frame counts on a 17k+5 grid from 124 (~5.2s) to 362 (~15.08s) — an
// off-grid count is rejected outright. Width and height on a multiple of 32.
const FPS = 24, H3_MIN_FRAMES = 124, H3_MAX_FRAMES = 362, H3_MAX_SECONDS = H3_MAX_FRAMES / FPS;
const MODEL_MODE = { "adsora-gen-2.0": "t2v", "adsora-gen-2.0-i2v": "i2v", "adsora-avatar-2.0": "avatar" };
const MODE_MODEL = { t2v: "adsora-gen-2.0", i2v: "adsora-gen-2.0-i2v", avatar: "adsora-avatar-2.0" };
function framesFor(seconds) {
  const wanted = Math.round(seconds * FPS);
  const k = Math.ceil((wanted - 5) / 17);          // snap UP: never shorter than the voice it carries
  return Math.min(H3_MAX_FRAMES, Math.max(H3_MIN_FRAMES, 17 * Math.max(0, k) + 5));
}
const snap32 = (n) => Math.max(32, Math.round(n / 32) * 32);
function dimsFor(aspect, quality) {
  const short = snap32(quality === "720p" ? 704 : 480), long = snap32(quality === "720p" ? 1280 : 832);
  if (aspect === "16:9") return { width: long, height: short };
  if (aspect === "1:1") return { width: short, height: short };
  return { width: short, height: long };
}
// Measured 2026-08-10 on the BLACKWELL_96 pool: 5.17s ≈ $0.11, 15.08s ≈ $0.55.
// Cost grows worse than linearly with length (attention), so a power fit, not a rate.
const estimateUsd = (seconds, quality) => 0.11 * Math.pow(seconds / 5.17, 1.47) * (quality === "720p" ? 2 : 1);
const realUsd = (executionMs) => (Number(executionMs) > 0 ? (Number(executionMs) / 3_600_000) * GPU_HOURLY : 0);

// ── graphs ────────────────────────────────────────────────────────────────────
const SLOT = {
  prompt: "__ADSORA_PROMPT__", negative: "__ADSORA_NEGATIVE__", seed: "__ADSORA_SEED__", steps: "__ADSORA_STEPS__",
  width: "__ADSORA_WIDTH__", height: "__ADSORA_HEIGHT__", frames: "__ADSORA_FRAMES__",
  image: "__ADSORA_IMAGE__", audio: "__ADSORA_AUDIO__", prev: "__ADSORA_PREV__",
};
const GRAPH_FILE = { t2v: "h3-t2v.json", i2v: "h3-i2v.json", s2v: "h3-s2v.json", s2vchain: "h3-s2v-chain.json" };
const GRAPH_ENV = { t2v: "ADSORA_WORKFLOW_H3_T2V", i2v: "ADSORA_WORKFLOW_H3_I2V", s2v: "ADSORA_WORKFLOW_H3", s2vchain: "ADSORA_WORKFLOW_H3_CHAIN" };
function graphFor(mode) {
  const file = join(GRAPH_DIR, GRAPH_FILE[mode]);
  if (existsSync(file)) {
    try { return { graph: JSON.parse(readFileSync(file, "utf8")), from: `config/adsoragen/${GRAPH_FILE[mode]}` }; }
    catch (e) { throw new Error(`${file} is not valid JSON: ${e.message}`); }
  }
  const raw = env(GRAPH_ENV[mode]);
  if (raw) {
    try { return { graph: JSON.parse(raw), from: `${GRAPH_ENV[mode]} (${envSource(GRAPH_ENV[mode])})` }; }
    catch (e) { throw new Error(`${GRAPH_ENV[mode]} is not valid JSON: ${e.message}`); }
  }
  if (mode === "s2vchain") { const g = graphFor("s2v"); return g ? { ...g, fallback: true } : null; }
  return null;
}
const graphSlots = (graph) => { const s = JSON.stringify(graph); return Object.keys(SLOT).filter((k) => s.includes(`"${SLOT[k]}"`)); };
/** Fill the graph's placeholders with this job's values. Numbers stay numbers. */
function buildWorkflow(mode, vars) {
  const found = graphFor(mode);
  if (!found) {
    throw new Error(`no ${mode} graph — put the ComfyUI Export (API) JSON at config/adsoragen/${GRAPH_FILE[mode]} or set ${GRAPH_ENV[mode]} (references/adsoragen-video.md §2)`);
  }
  let json = JSON.stringify(found.graph);
  const put = (slot, value) => {
    const quoted = new RegExp(`"${slot}"`, "g");
    json = typeof value === "number" ? json.replace(quoted, String(value)) : json.replace(quoted, JSON.stringify(value));
  };
  put(SLOT.prompt, vars.prompt); put(SLOT.negative, ""); put(SLOT.seed, vars.seed); put(SLOT.steps, vars.steps);
  put(SLOT.width, vars.width); put(SLOT.height, vars.height); put(SLOT.frames, vars.frames);
  if (vars.imageName) put(SLOT.image, vars.imageName);
  if (vars.audioName) put(SLOT.audio, vars.audioName);
  if (vars.prevName) put(SLOT.prev, vars.prevName);
  const leftover = Object.values(SLOT).filter((s) => json.includes(`"${s}"`));
  if (leftover.length) throw new Error(`the ${mode} graph (${found.from}) still has ${leftover.join(", ")} after filling — this job does not supply them`);
  return { workflow: JSON.parse(json), from: found.from, fallback: !!found.fallback };
}

// The wrapper the studio puts around every avatar prompt. H3 binds a reference
// only where the prompt MENTIONS it (<Picture 1>, <Audio 1>, <Video 1>), and as
// a general video model it will cut to b-roll of the room after ~4s unless the
// single locked-off shot is stated outright. It also burns garbled captions
// into the frame unprompted; the clean-frame clause stops that.
function avatarPrompt(userPrompt, continues, accent) {
  const body = String(userPrompt || "").trim().replace(/\s+/g, " ");
  const cont = continues
    ? "This continues the shot in <Video 1>: the same person, same framing, same room, same lighting and same clothing, carrying straight on from where it left off with no cut and no jump. "
    : "";
  const acc = accent && String(accent).trim()
    ? `The speaker is a native ${accent.trim()} speaker with a strong, unmistakable ${accent.trim()} accent, and their mouth shapes, jaw movement and expression match that accent exactly. `
    : "";
  return cont +
    "A single continuous shot of the person in <Picture 1>, speaking the words in <Audio 1>, facing the camera for the entire video. " +
    acc +
    "Precise lip-sync: every mouth shape matches the exact word being said in <Audio 1>, lips and jaw clearly articulate each syllable, teeth and tongue visible where the sound requires it, and the mouth closes fully on every p, b and m. The mouth is still when the audio is silent. " +
    (body ? body + " " : "") +
    "Locked-off framing on the speaker, no cuts, no scene changes, no b-roll, no other shots. " +
    "Clean frame with no on-screen text: no subtitles, no captions, no burned-in words, no watermark, no logo, no graphics or overlays of any kind.";
}

// ── local media helpers ───────────────────────────────────────────────────────
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".mp4": "video/mp4" };
function dataUrl(file) {
  const p = expand(file);
  if (!existsSync(p)) throw new Error(`file not found: ${p}`);
  return `data:${MIME[extname(p).toLowerCase()] || "application/octet-stream"};base64,${readFileSync(p).toString("base64")}`;
}
function run(cmd, args, what) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error?.code === "ENOENT") throw new Error(`${cmd} is not installed (needed to ${what}); brew install ffmpeg`);
  if (r.status !== 0) throw new Error(`${cmd} failed while trying to ${what}: ${(r.stderr || "").trim().split("\n").slice(-3).join(" | ")}`);
  return r.stdout;
}
const probeSeconds = (file) => Number(run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], "measure the audio").trim());
function normaliseVoice(src, dest) {
  // mono 24 kHz PCM: one predictable input for the graph's LoadAudio and for the mux.
  const s = expand(src);
  if (!existsSync(s)) throw new Error(`audio not found: ${s}`);
  run(FFMPEG, ["-y", "-v", "error", "-i", s, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", dest], "normalise the voice track");
  return probeSeconds(dest);
}
function muxVoice(rawMp4, voiceWav, dest) {
  // Our exact voice back over H3's picture. -shortest trims the tail H3 adds
  // when the audio does not fill the frame grid exactly.
  run(FFMPEG, ["-y", "-v", "error", "-i", rawMp4, "-i", voiceWav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", dest], "lay the voice over the clip");
}
function cutTail(mp4, dest) {
  // ~1.8s of picture, no audio: H3 reads a reference video at 2fps with
  // timestamps, so a short clip carries framing, lighting and motion forward.
  run(FFMPEG, ["-y", "-v", "error", "-sseof", "-1.8", "-i", mp4, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "24", dest], "cut the continuity tail");
}

// ── RunPod calls ──────────────────────────────────────────────────────────────
const inflight = new Set(); // "runpod:<endpoint>:<id>" — cancelled on Ctrl-C
async function health(endpoint) {
  const r = await fetch(`${api(endpoint)}/health`, { headers: authHeaders() });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, workers: body.workers || {}, jobs: body.jobs || {} };
}
async function submit(workflow, files) {
  const body = JSON.stringify({ input: { workflow, ...(files.length ? { images: files } : {}) } });
  let lastErr = "";
  for (const endpoint of ENDPOINTS) {
    let r;
    try { r = await fetch(`${api(endpoint)}/run`, { method: "POST", headers: authHeaders(), body }); }
    catch (e) { lastErr = `${endpoint}: ${e.message}`; continue; }           // network: try the next endpoint
    if (r.ok) {
      const data = await r.json().catch(() => null);
      const id = String(data?.id ?? "");
      if (!id) throw new Error(`RunPod ${endpoint} accepted the job but returned no id`);
      const jobId = `runpod:${endpoint}:${id}`;
      inflight.add(jobId);
      return jobId;
    }
    const detail = (await r.text().catch(() => "")).slice(0, 200);
    if (r.status === 401 || r.status === 403) throw new Error(`RunPod ${r.status}: the API key was refused (${detail})`);
    lastErr = `${endpoint}: RunPod ${r.status} ${detail}`;
    if (r.status < 500 && r.status !== 429) break;                            // a 4xx is our payload, not the endpoint
  }
  throw new Error(`submit failed on every endpoint — ${lastErr}`);
}
const splitJobId = (jobId) => { const m = /^runpod:([^:]+):(.+)$/.exec(jobId); if (!m) throw new Error(`not a runpod job id: ${jobId}`); return { endpoint: m[1], id: m[2] }; };
async function cancel(jobId) {
  const { endpoint, id } = splitJobId(jobId);
  const r = await fetch(`${api(endpoint)}/cancel/${encodeURIComponent(id)}`, { method: "POST", headers: authHeaders() }).catch(() => null);
  inflight.delete(jobId);
  return !!r?.ok;
}
async function poll(jobId, { timeoutMs = 25 * 60_000, onStatus } = {}) {
  const { endpoint, id } = splitJobId(jobId);
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    await sleep(5000);
    let r;
    try { r = await fetch(`${api(endpoint)}/status/${encodeURIComponent(id)}`, { headers: authHeaders() }); }
    catch { continue; }                                                        // network blip: keep waiting
    if (!r.ok) {
      if (r.status >= 500 || r.status === 429 || r.status === 408) continue;   // transient on the STATUS call ≠ a dead job
      throw new Error(`poll ${r.status}`);
    }
    const data = await r.json().catch(() => ({}));
    const status = String(data.status || "").toUpperCase();
    if (status !== last) { onStatus?.(status); last = status; }
    if (status === "IN_QUEUE" || status === "IN_PROGRESS" || !status) continue;
    inflight.delete(jobId);
    if (status !== "COMPLETED") {
      const detail = typeof data.error === "string" ? data.error : JSON.stringify(data.output ?? {}).slice(0, 300);
      throw new Error(`Adsora Gen ${status}: ${detail || "no detail"}`);
    }
    return data;
  }
  await cancel(jobId);                                                         // do not leave it to run and bill later
  throw new Error(`timed out after ${Math.round(timeoutMs / 60000)} min; job cancelled`);
}
async function saveOutput(data, dest) {
  // The patched worker folds SaveVideo output into `images`; accept s3_url or base64.
  const out = data.output ?? {};
  const first = Array.isArray(out.images) ? out.images[0] : undefined;
  if (!first) {
    const errs = Array.isArray(out.errors) ? out.errors.join("; ").slice(0, 300) : "";
    throw new Error(errs
      ? `Adsora Gen returned no clip: ${errs}`
      : "Adsora Gen finished but returned nothing. The stock worker drops anything not under `images`; /runpod-volume/runtime/boot.sh must apply its handler patch for SaveVideo output to come back.");
  }
  let bytes;
  if (first.type === "s3_url") {
    const r = await fetch(String(first.data));
    if (!r.ok) throw new Error(`could not download the finished clip (${r.status})`);
    bytes = Buffer.from(await r.arrayBuffer());
  } else {
    bytes = Buffer.from(String(first.data), "base64");
  }
  const isMp4 = /\.mp4$/i.test(String(first.filename || "")) || bytes.subarray(4, 8).toString("ascii") === "ftyp";
  mkdirSync(dirname(dest), { recursive: true });
  if (!isMp4) {
    const alt = dest.replace(/\.mp4$/i, "") + (bytes.subarray(0, 4).toString("ascii") === "RIFF" ? ".webp" : ".bin");
    writeFileSync(alt, bytes);
    throw new Error(`the worker returned a non-mp4 (${first.filename || "unnamed"}), saved to ${alt}. The graph must end in SaveVideo (H3), not SaveAnimatedWEBP.`);
  }
  writeFileSync(dest, bytes);
  return bytes.length;
}

// ── jobs ──────────────────────────────────────────────────────────────────────
function resolveJob(cfg, job, i) {
  const j = { ...job };
  j.name = j.name || `clip-${i + 1}`;
  j.mode = j.mode || MODEL_MODE[j.model] || (j.audio ? "avatar" : j.image ? "i2v" : "t2v");
  if (!["avatar", "i2v", "t2v"].includes(j.mode)) throw new Error(`[${j.name}] unknown mode "${j.mode}"`);
  j.model = MODE_MODEL[j.mode];
  j.aspect = j.aspect || cfg.aspect || "9:16";
  j.quality = j.quality === "720p" || (!j.quality && cfg.quality === "720p") ? "720p" : "480p";
  j.steps = Number(j.steps || cfg.steps) || (j.mode === "avatar" ? S2V_STEPS : VIDEO_STEPS);
  j.accent = j.accent ?? cfg.accent ?? "";
  j.out = expand(j.out || join(cfg.outDir, `${j.name}.mp4`));
  if (j.mode !== "t2v" && !j.image) throw new Error(`[${j.name}] ${j.mode} needs "image" (a reference portrait / start frame)`);
  if (j.mode !== "t2v" && !existsSync(expand(j.image))) throw new Error(`[${j.name}] image not found: ${expand(j.image)}`);
  if (j.mode === "avatar" && !j.audio) throw new Error(`[${j.name}] avatar needs "audio" — the voice to lip-sync. Make it first (tools/faceless.mjs --vo-only), then run this.`);
  if (j.mode !== "avatar" && j.audio) throw new Error(`[${j.name}] ${j.mode} cannot be driven by a voice track; use mode "avatar"`);
  if (j.mode === "avatar" && j.prompt && /<(Picture|Audio|Video) \d>/.test(j.prompt)) throw new Error(`[${j.name}] leave the <Picture 1>/<Audio 1> tags out of "prompt"; the tool adds them`);
  return j;
}
function planJob(cfg, j, work) {
  // Length: the audio decides an avatar clip; "seconds" decides the rest.
  let seconds, voiceWav = null;
  if (j.mode === "avatar") {
    voiceWav = join(work, `${j.name}.voice.wav`);
    const audioSec = normaliseVoice(j.audio, voiceWav);
    if (!(audioSec > 0)) throw new Error(`[${j.name}] could not read a duration from ${j.audio}`);
    if (audioSec > H3_MAX_SECONDS) throw new Error(`[${j.name}] the voice is ${audioSec.toFixed(1)}s; H3 does at most ${H3_MAX_SECONDS.toFixed(2)}s (~44 words) in one clip. Split the line across two clips ("chain": true keeps the shot continuous).`);
    seconds = Math.min(H3_MAX_SECONDS, audioSec + 0.3);
    j.audioSeconds = audioSec;
  } else {
    seconds = Number(j.seconds) || 5;
    if (seconds > H3_MAX_SECONDS + 0.01) throw new Error(`[${j.name}] ${seconds}s is over H3's ${H3_MAX_SECONDS.toFixed(2)}s ceiling; ask for several short clips instead`);
  }
  j.frames = framesFor(seconds);
  j.clipSeconds = j.frames / FPS;
  const { width, height } = dimsFor(j.aspect, j.quality);
  j.width = width; j.height = height;
  j.estUsd = estimateUsd(j.clipSeconds, j.quality);
  j.voiceWav = voiceWav;
  return j;
}
/** Which graph a job uses, and whether a chained avatar job really has a chain graph. */
function graphPlan(j, chaining) {
  const mode = j.mode === "avatar" ? (chaining ? "s2vchain" : "s2v") : j.mode;
  const found = graphFor(mode);
  const realChain = chaining && !!found && !found.fallback;
  return { mode, found, realChain };
}
function buildFor(j, seed, chaining) {
  const { mode, realChain } = graphPlan(j, chaining);
  const built = buildWorkflow(mode, {
    prompt: j.mode === "avatar" ? avatarPrompt(j.prompt, chaining, j.accent) : String(j.prompt || ""),
    seed, steps: j.steps, width: j.width, height: j.height, frames: j.frames,
    imageName: j.mode !== "t2v" ? "adsora_ref.png" : undefined,
    audioName: j.mode === "avatar" ? "adsora_voice.wav" : undefined,
    prevName: realChain ? "adsora_prev.mp4" : undefined,
  });
  return { ...built, realChain };
}
async function runJob(j, seed, prevTail, log) {
  const t0 = Date.now();
  const chaining = j.mode === "avatar" && !!prevTail;
  const built = buildFor(j, seed, chaining);
  if (chaining && !built.realChain) log(`[${j.name}] no s2v-chain graph — using the plain s2v graph; the join to the previous clip may show a framing change`);
  // worker-comfyui's one file door is `images`; it forwards the bytes to
  // ComfyUI's /upload/image untouched and honours the name, so a .wav or .mp4
  // lands in ComfyUI's input dir where LoadAudio / LoadVideo find it.
  const files = [];
  if (j.mode !== "t2v") files.push({ name: "adsora_ref.png", image: dataUrl(j.image) });
  if (j.mode === "avatar") files.push({ name: "adsora_voice.wav", image: dataUrl(j.voiceWav) });
  if (built.realChain) files.push({ name: "adsora_prev.mp4", image: dataUrl(prevTail) });

  const jobId = await submit(built.workflow, files);
  log(`[${j.name}] submitted ${jobId}  ${j.mode} ${j.width}x${j.height} ${j.frames}f (${j.clipSeconds.toFixed(1)}s) seed ${seed} steps ${j.steps}  graph ${built.from}  eta ~${ETA_SEC}s cold`);
  const data = await poll(jobId, { onStatus: (s) => log(`[${j.name}]   ${Math.round((Date.now() - t0) / 1000)}s  ${s}`) });

  const rawOut = j.mode === "avatar" ? j.out.replace(/\.mp4$/i, ".h3.mp4") : j.out;
  const bytes = await saveOutput(data, rawOut);
  if (j.mode === "avatar") {
    if (j.keepModelAudio) { mkdirSync(dirname(j.out), { recursive: true }); writeFileSync(j.out, readFileSync(rawOut)); }
    else muxVoice(rawOut, j.voiceWav, j.out);
  }
  const costUsd = realUsd(data.executionTime);
  log(`[${j.name}] done in ${Math.round((Date.now() - t0) / 1000)}s → ${j.out}  (${(bytes / 1024).toFixed(0)} KB, exec ${Math.round(Number(data.executionTime || 0) / 1000)}s, $${costUsd.toFixed(3)})`);
  return { jobId, seed, executionMs: Number(data.executionTime) || null, delayMs: Number(data.delayTime) || null, costUsd: Number(costUsd.toFixed(4)), out: j.out, rawOut: j.mode === "avatar" ? rawOut : undefined, graph: built.from, elapsedS: Math.round((Date.now() - t0) / 1000) };
}

// ── commands ──────────────────────────────────────────────────────────────────
function keyReport() {
  const lines = [];
  lines.push(`RUNPOD_API_KEY            ${API_KEY ? `set (${envSource("RUNPOD_API_KEY")})` : "MISSING"}`);
  lines.push(`RUNPOD_VIDEO_ENDPOINT_ID  ${ENDPOINTS.length ? `${ENDPOINTS.join(", ")} (${envSource("RUNPOD_VIDEO_ENDPOINT_ID")})` : "MISSING"}`);
  lines.push(`steps avatar/video ${S2V_STEPS}/${VIDEO_STEPS} · gpu $${GPU_HOURLY}/hr · key file ${existsSync(KEY_FILE) ? "config/adsoragen.env" : "config/adsoragen.env ABSENT (copy adsoragen.env.example)"}`);
  for (const mode of ["t2v", "i2v", "s2v", "s2vchain"]) {
    let g = null, err = "";
    try { g = graphFor(mode); } catch (e) { err = e.message; }
    lines.push(`graph ${mode.padEnd(8)} ${err ? `INVALID — ${err}` : g ? `${g.fallback ? "falls back to s2v (joins may show a framing change)" : g.from}  [${graphSlots(g.graph).join(",")}]` : "MISSING"}`);
  }
  return lines;
}
async function cmdHealth() {
  console.log(keyReport().join("\n"));
  if (!API_KEY || !ENDPOINTS.length) { console.log("\nNOT LIVE — add the missing values to config/adsoragen.env (references/adsoragen-video.md §1)."); process.exit(1); }
  let anyReady = false;
  for (const ep of ENDPOINTS) {
    try {
      const h = await health(ep);
      const w = h.workers, q = h.jobs;
      console.log(`endpoint ${ep}: ${h.ok ? "OK" : `HTTP ${h.status}`}  workers ready ${w.ready ?? 0} idle ${w.idle ?? 0} running ${w.running ?? 0} init ${w.initializing ?? 0} throttled ${w.throttled ?? 0}  queue ${q.inQueue ?? 0} in progress ${q.inProgress ?? 0}`);
      if (h.ok) anyReady = true;
    } catch (e) { console.log(`endpoint ${ep}: unreachable — ${e.message}`); }
  }
  const graphsOk = ["t2v", "i2v", "s2v"].every((m) => { try { return !!graphFor(m); } catch { return false; } });
  console.log(anyReady && graphsOk ? "\nLIVE — face UGC routes to Adsora Gen." : `\nNOT LIVE — ${anyReady ? "" : "no endpoint answered; "}${graphsOk ? "" : "at least one graph is missing"}`.trim());
  process.exit(anyReady && graphsOk ? 0 : 1);
}
async function cmdCancel(jobId) {
  if (!API_KEY) { console.error("RUNPOD_API_KEY is missing"); process.exit(1); }
  const ok = await cancel(jobId);
  console.log(ok ? `cancelled ${jobId}` : `cancel request for ${jobId} was not accepted (already finished?)`);
  process.exit(ok ? 0 : 1);
}
/** --import-env: copy the RunPod keys and H3 graphs out of a pulled dotenv into the skill. Values are never printed. */
function cmdImportEnv(srcPath) {
  const src = parseDotenv(readFileSync(expand(srcPath), "utf8"));
  const KEYS = ["RUNPOD_API_KEY", "RUNPOD_VIDEO_ENDPOINT_ID", "RUNPOD_VIDEO_ENDPOINT_ID_2", "RUNPOD_VIDEO_ENDPOINT_ID_3", "RUNPOD_GPU_HOURLY", "RUNPOD_S2V_STEPS", "RUNPOD_VIDEO_STEPS", "RUNPOD_VIDEO_ETA_SEC"];
  mkdirSync(GRAPH_DIR, { recursive: true });
  let text = existsSync(KEY_FILE) ? readFileSync(KEY_FILE, "utf8") : "# Adsora Gen — the skill's own key file (see adsoragen.env.example)\n";
  const imported = [], skipped = [];
  for (const k of KEYS) {
    const v = src[k];
    if (!v || v.includes("SENSITIVE")) { skipped.push(k); continue; }
    const line = `${k}=${v}`;
    const re = new RegExp(`^#?\\s*${k}=.*$`, "m");
    text = re.test(text) ? text.replace(re, line) : text.replace(/\n?$/, "\n") + line + "\n";
    imported.push(`${k} (${k === "RUNPOD_API_KEY" ? `${v.slice(0, 4)}…, ${v.length} chars` : k.startsWith("RUNPOD_VIDEO_ENDPOINT") ? v : v})`);
  }
  writeFileSync(KEY_FILE, text);
  const graphs = [];
  for (const mode of Object.keys(GRAPH_ENV)) {
    const raw = src[GRAPH_ENV[mode]];
    if (!raw || raw.includes("SENSITIVE")) { skipped.push(GRAPH_ENV[mode]); continue; }
    let graph;
    try { graph = JSON.parse(raw); } catch (e) { graphs.push(`${GRAPH_ENV[mode]}: NOT valid JSON after unescaping (${e.message.slice(0, 60)}) — skipped`); continue; }
    const slots = graphSlots(graph);
    if (!slots.includes("prompt")) { graphs.push(`${GRAPH_ENV[mode]}: no __ADSORA_PROMPT__ placeholder — skipped`); continue; }
    writeFileSync(join(GRAPH_DIR, GRAPH_FILE[mode]), JSON.stringify(graph, null, 2));
    graphs.push(`config/adsoragen/${GRAPH_FILE[mode]}  ← ${GRAPH_ENV[mode]}  (${Object.keys(graph).length} nodes; slots ${slots.join(",")})`);
  }
  console.log(`imported into config/adsoragen.env: ${imported.length ? imported.join(", ") : "nothing"}`);
  for (const g of graphs) console.log(`graph: ${g}`);
  if (skipped.length) console.log(`not in ${srcPath}: ${skipped.join(", ")}`);
  console.log(`\nNow delete ${srcPath}, then run: node tools/adsoragen.mjs --health`);
}
async function cmdRun(jobsPath, planOnly, dump) {
  const cfg = JSON.parse(readFileSync(jobsPath, "utf8"));
  if (!Array.isArray(cfg.jobs) || !cfg.jobs.length) throw new Error("jobs file has no jobs[]");
  cfg.outDir = expand(cfg.outDir || dirname(resolve(jobsPath)));
  const work = join(cfg.outDir, ".adsoragen-work");
  mkdirSync(work, { recursive: true });
  const log = (s) => console.log(s);

  const jobs = cfg.jobs.map((job, i) => planJob(cfg, resolveJob(cfg, job, i), work));
  const seed = Number(cfg.seed) || Math.floor(Math.random() * 2_147_483_647);
  const chain = cfg.chain === true;

  // Everything that would fail on submit, listed before any spend — including a
  // dry build of each job's graph, so an unfilled or missing placeholder shows
  // up here and not as a paid render that came back wrong.
  const blockers = [];
  if (!API_KEY) blockers.push("RUNPOD_API_KEY is missing (config/adsoragen.env)");
  if (!ENDPOINTS.length) blockers.push("RUNPOD_VIDEO_ENDPOINT_ID is missing (config/adsoragen.env)");
  const notes = [];
  let prevAvatar = false;
  for (const j of jobs) {
    const chaining = chain && j.mode === "avatar" && prevAvatar;
    try {
      const built = buildFor(j, Number(j.seed) || seed, chaining);
      if (chaining && !built.realChain) notes.push(`${j.name}: no s2v-chain graph, joins may show a framing change`);
      if (dump) writeFileSync(join(work, `${j.name}.workflow.json`), JSON.stringify(built.workflow, null, 2));
    } catch (e) { blockers.push(e.message); }
    if (j.mode === "avatar") prevAvatar = true;
  }
  const total = jobs.reduce((a, j) => a + j.estUsd, 0);
  console.log(`\nAdsora Gen plan — ${jobs.length} job(s), seed ${seed}${chain ? ", chained" : ""}, out ${cfg.outDir}`);
  console.log("| job | mode | size | frames | length | est. |");
  console.log("|---|---|---|---|---|---|");
  for (const j of jobs) console.log(`| ${j.name} | ${j.mode}${j.mode === "avatar" ? ` (voice ${j.audioSeconds.toFixed(1)}s)` : ""} | ${j.width}x${j.height} ${j.quality} | ${j.frames} | ${j.clipSeconds.toFixed(1)}s | $${j.estUsd.toFixed(2)} |`);
  console.log(`| TOTAL | | | | | $${total.toFixed(2)} est. GPU time (real cost is written to results) |`);
  for (const n of notes) console.log(`note: ${n}`);
  if (blockers.length) console.log(`\nBLOCKED:\n  - ${[...new Set(blockers)].join("\n  - ")}`);
  if (dump) console.log(`built workflows dumped to ${work}/`);
  if (planOnly) { console.log("\n--plan: nothing submitted."); if (!dump) rmSync(work, { recursive: true, force: true }); process.exit(blockers.length ? 2 : 0); }
  if (blockers.length) { rmSync(work, { recursive: true, force: true }); process.exit(2); }

  const results = [];
  const record = (j, r) => results.push({ name: j.name, mode: j.mode, model: j.model, frames: j.frames, seconds: j.clipSeconds, width: j.width, height: j.height, quality: j.quality, steps: j.steps, estUsd: Number(j.estUsd.toFixed(3)), prompt_chars: String(j.prompt || "").length, ...r });
  if (chain) {
    let prevTail = null;
    for (const j of jobs) {
      try {
        const r = await runJob(j, Number(j.seed) || seed, j.mode === "avatar" ? prevTail : null, log);
        record(j, { ok: true, ...r });
        if (j.mode === "avatar") { const tail = join(work, `${j.name}.tail.mp4`); cutTail(j.out, tail); prevTail = tail; }
      } catch (e) { record(j, { ok: false, error: String(e.message || e) }); log(`[${j.name}] FAILED: ${e.message}`); break; } // a broken link ends the chain
    }
  } else {
    const queue = [...jobs];
    const lanes = Array.from({ length: Math.max(1, Math.min(Number(cfg.concurrency) || 2, jobs.length)) }, async () => {
      while (queue.length) {
        const j = queue.shift();
        try { record(j, { ok: true, ...(await runJob(j, Number(j.seed) || seed, null, log)) }); }
        catch (e) { record(j, { ok: false, error: String(e.message || e) }); log(`[${j.name}] FAILED: ${e.message}`); }
      }
    });
    await Promise.all(lanes);
  }
  const spent = results.reduce((a, r) => a + (r.costUsd || 0), 0);
  const resultsPath = jobsPath.replace(/\.json$/i, "") + ".results.json";
  writeFileSync(resultsPath, JSON.stringify({ ran: new Date().toISOString(), seed, gpuHourly: GPU_HOURLY, endpoints: ENDPOINTS, outDir: cfg.outDir, totalUsd: Number(spent.toFixed(4)), results }, null, 2));
  rmSync(work, { recursive: true, force: true });
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${jobs.length} clips landed in ${cfg.outDir} · real cost $${spent.toFixed(3)} · ${resultsPath}`);
  process.exit(failed ? 1 : 0);
}

// Ctrl-C: cancel what is in flight. An uncancelled job eventually runs and bills.
process.on("SIGINT", async () => {
  if (inflight.size) { console.log(`\ncancelling ${inflight.size} in-flight job(s)…`); await Promise.all([...inflight].map(cancel)); }
  process.exit(130);
});

const argv = process.argv.slice(2);
try {
  if (argv.includes("--health")) await cmdHealth();
  else if (argv.includes("--cancel")) await cmdCancel(argv[argv.indexOf("--cancel") + 1] || "");
  else if (argv.includes("--import-env")) cmdImportEnv(argv[argv.indexOf("--import-env") + 1] || "");
  else {
    const jobsPath = argv.find((a) => !a.startsWith("--"));
    if (!jobsPath) { console.error("usage: node adsoragen.mjs <jobs.json> [--plan] [--dump] | --health | --cancel <jobId> | --import-env <file>"); process.exit(1); }
    await cmdRun(jobsPath, argv.includes("--plan"), argv.includes("--dump"));
  }
} catch (e) {
  console.error(`adsoragen: ${e.message || e}`);
  process.exit(1);
}
