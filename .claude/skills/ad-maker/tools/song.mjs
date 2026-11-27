#!/usr/bin/env node
/**
 * song.mjs — a caption + lyrics in, a finished song out. Single file, no build step.
 *
 * The skill's LOCAL music maker: generates full songs (vocals) or instrumental
 * beds on this machine with ACE-Step 1.5, headless, no web UI, no API, no per-track
 * cost (GPU time only). The output is yours (generated locally), so it clears the
 * house no-unlicensed-music rule (references/edit-assembly.md §9).
 *
 *   node song.mjs jobs.json            # generate every job in the file
 *   node song.mjs jobs.json --plan     # print what it would make, generate nothing
 *   node song.mjs --health             # check the ACE-Step install is usable
 *
 * Use it when: the new "cartoon music video" ad (the song IS the ad), or a
 * bespoke bed when nothing in the house Soundtracks pool fits (hard rule 20 —
 * pool first, generate only when nothing fits). References: references/song-maker.md,
 * references/formats/cartoon-music-video.md, references/house-defaults.md §4.
 *
 * ── SETUP (once per machine) ─────────────────────────────────────────────────
 *
 *   brew install git ffmpeg uv
 *   git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/.adsora/ace-step
 *   cd ~/.adsora/ace-step && uv sync        # builds the venv, picks Python 3.11/3.12
 *   # models (~10GB) auto-download on the first generation, then it runs offline.
 *
 * The tool finds the install via, in order: a job/config `acestepHome`, the
 * ACESTEP_HOME env var, then ~/.adsora/ace-step, ~/ACE-Step-1.5,
 * ~/Documents/Adsora/ACE-Step-1.5, ./ACE-Step-1.5. Point ACESTEP_HOME
 * at it if you cloned somewhere else. Apple Silicon uses the native MLX backend
 * automatically; CUDA/CPU are auto-detected on other machines.
 *
 * ── JOBS FILE ────────────────────────────────────────────────────────────────
 *
 * {
 *   "acestepHome": "~/.adsora/ace-step",   // optional; else auto-detected (see above)
 *   "outDir":      "./05-assets/song",     // where finished tracks land
 *   "audioFormat": "mp3",                  // mp3 | wav | flac  (default mp3)
 *   "lmModel":     "acestep-5Hz-lm-1.7B",  // optional; 0.6B (light) | 1.7B | 4B (max, needs ~24GB)
 *   "jobs": [
 *     {
 *       "name":       "cartoon-anthem",    // output basename → <outDir>/cartoon-anthem.mp3
 *       "caption":    "upbeat pop-punk, bright cartoon energy, gang vocals, huge chorus",
 *       "lyrics":     "[Verse]\n...\n[Chorus]\n...",  // or "lyricsFile": "/path/lyrics.txt"
 *       "instrumental": false,             // true = a bed with NO vocals
 *       "duration":   45,                  // seconds; omit or -1 = the model decides
 *       "vocalLanguage": "en",             // optional
 *       "bpm":        128,                 // optional
 *       "keyscale":   "C major",           // optional
 *       "seed":       42,                  // optional; a fixed seed = reproducible
 *       "sampleQuery": "a 30s jingle about fast free shipping"  // optional: let the
 *                                          // model WRITE the lyrics from a vibe
 *                                          // (ignore caption/lyrics when set)
 *     }
 *   ]
 * }
 *
 * Lyrics use ACE-Step section tags: [Intro] [Verse] [Chorus] [Bridge] [Outro],
 * one lyric line per line. The tool passes your lyrics VERBATIM (no rewrite).
 * A job with "sampleQuery" instead has the model invent bpm/key/lyrics from the
 * one-line description.
 *
 * Headless recipe (why it never hangs): ACE-Step's CLI pauses for interactive
 * prompt-editing only when thinking=true; this tool writes thinking=false and
 * feeds /dev/null on stdin, so it runs unattended. The 5Hz LM still enriches the
 * caption / metadata — only the edit pause is off.
 */

import { readFile, writeFile, mkdir, readdir, stat, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve, isAbsolute } from "node:path";
import { homedir } from "node:os";

const AUDIO_EXTS = [".mp3", ".wav", ".flac", ".ogg", ".m4a"];

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

function tomlString(s) {
  // A JSON-escaped string is a valid TOML basic string (\n \t \" \\ \uXXXX).
  return JSON.stringify(String(s));
}

// ── locate the ACE-Step install ──────────────────────────────────────────────
function resolveAceStepHome(preferred) {
  const candidates = [
    preferred,
    process.env.ACESTEP_HOME,
    "~/.adsora/ace-step",
    "~/ACE-Step-1.5",
    "~/Documents/Adsora/ACE-Step-1.5",
    "./ACE-Step-1.5",
  ]
    .filter(Boolean)
    .map((p) => resolve(expandHome(p)));
  for (const dir of candidates) {
    if (existsSync(join(dir, "cli.py")) && pythonBin(dir)) return dir;
  }
  return null;
}

function pythonBin(home) {
  for (const rel of [".venv/bin/python", ".venv/bin/python3", "python_embedded/bin/python3.11"]) {
    const p = join(home, rel);
    if (existsSync(p)) return p;
  }
  return null;
}

async function newestAudio(dir) {
  let best = null;
  let bestMtime = -1;
  async function walk(d) {
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (AUDIO_EXTS.some((x) => e.name.toLowerCase().endsWith(x))) {
        const m = (await stat(full)).mtimeMs;
        if (m > bestMtime) {
          bestMtime = m;
          best = full;
        }
      }
    }
  }
  await walk(dir);
  return best;
}

// ── build the ACE-Step TOML for one job ──────────────────────────────────────
function buildToml(job, cfg, saveDir) {
  const L = [];
  L.push(`task_type = "text2music"`);
  L.push(`save_dir = ${tomlString(saveDir)}`);
  L.push(`audio_format = ${tomlString(cfg.audioFormat || "mp3")}`);
  L.push(`batch_size = 1`);
  // thinking=false is what keeps this headless (no interactive prompt-edit pause).
  L.push(`thinking = false`);
  if (cfg.lmModel) L.push(`lm_model_path = ${tomlString(cfg.lmModel)}`);

  if (job.sampleQuery) {
    // Let the LM invent caption/lyrics/metadata from a one-line vibe.
    L.push(`sample_mode = true`);
    L.push(`sample_query = ${tomlString(job.sampleQuery)}`);
  } else {
    if (job.caption) L.push(`caption = ${tomlString(job.caption)}`);
    if (job.instrumental) {
      L.push(`instrumental = true`);
    } else {
      L.push(`instrumental = false`);
      if (job.lyrics) L.push(`lyrics = ${tomlString(job.lyrics)}`);
    }
  }
  if (job.vocalLanguage) L.push(`vocal_language = ${tomlString(job.vocalLanguage)}`);
  if (job.duration != null) L.push(`duration = ${Number(job.duration)}`);
  if (job.bpm != null) L.push(`bpm = ${Number(job.bpm)}`);
  if (job.keyscale) L.push(`keyscale = ${tomlString(job.keyscale)}`);
  if (job.timesignature) L.push(`timesignature = ${tomlString(String(job.timesignature))}`);
  if (job.seed != null) L.push(`seed = ${Number(job.seed)}`);
  return L.join("\n") + "\n";
}

function run(cmd, args, opts) {
  return new Promise((res) => {
    const p = spawn(cmd, args, { ...opts });
    let out = "";
    p.stdout?.on("data", (d) => (out += d));
    p.stderr?.on("data", (d) => (out += d));
    p.on("close", (code) => res({ code, out }));
    p.on("error", (e) => res({ code: -1, out: String(e) }));
  });
}

async function loadJob(job, baseDir) {
  const j = { ...job };
  if (j.lyricsFile && !j.lyrics) {
    const p = isAbsolute(j.lyricsFile) ? j.lyricsFile : join(baseDir, j.lyricsFile);
    j.lyrics = await readFile(expandHome(p), "utf-8");
  }
  return j;
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const files = argv.filter((a) => !a.startsWith("--"));
  const jobsPath = files[0];

  const home = resolveAceStepHome();
  if (flags.has("--health")) {
    if (!home) {
      console.log("song.mjs health: ACE-Step NOT found.");
      console.log("  Looked for cli.py + a .venv in: $ACESTEP_HOME, ~/.adsora/ace-step,");
      console.log("  ~/ACE-Step-1.5, ~/Documents/Adsora/ACE-Step-1.5, ./ACE-Step-1.5");
      console.log("  Install: git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/.adsora/ace-step && cd ~/.adsora/ace-step && uv sync");
      process.exit(1);
    }
    const py = pythonBin(home);
    const ck = existsSync(join(home, "checkpoints"));
    console.log("song.mjs health: LIVE");
    console.log(`  install:     ${home}`);
    console.log(`  python:      ${py}`);
    console.log(`  models:      ${ck ? "present (offline-ready)" : "NOT yet downloaded — first run pulls ~10GB"}`);
    console.log(`  backend:     ${process.platform === "darwin" && process.arch === "arm64" ? "MLX (Apple Silicon)" : "auto (CUDA/CPU)"}`);
    console.log("  cost:        $0.00 per track (local; GPU time only)");
    process.exit(0);
  }

  if (!jobsPath) {
    console.error("usage: node song.mjs jobs.json [--plan]   |   node song.mjs --health");
    process.exit(2);
  }

  const cfg = JSON.parse(await readFile(jobsPath, "utf-8"));
  const baseDir = resolve(jobsPath, "..");
  const outDir = resolve(baseDir, expandHome(cfg.outDir || "./song-out"));
  const resolvedHome = resolveAceStepHome(cfg.acestepHome);
  const jobs = cfg.jobs || [];

  if (flags.has("--plan")) {
    console.log(`song.mjs plan — ${jobs.length} track(s)`);
    console.log(`  install: ${resolvedHome || "NOT FOUND (run --health)"}`);
    console.log(`  outDir:  ${outDir}`);
    for (const raw of jobs) {
      const j = await loadJob(raw, baseDir);
      const mode = j.sampleQuery ? "sample (LM writes lyrics)" : j.instrumental ? "instrumental bed" : "song with vocals";
      const dur = j.duration != null ? `${j.duration}s` : "auto";
      console.log(`  • ${j.name}.${cfg.audioFormat || "mp3"}  —  ${mode}, ${dur}${j.seed != null ? `, seed ${j.seed}` : ""}`);
    }
    console.log("  cost: $0.00 (local). Nothing generated — drop --plan to run.");
    process.exit(0);
  }

  if (!resolvedHome) {
    console.error("song.mjs: ACE-Step not found. Run `node tools/song.mjs --health` for install steps.");
    process.exit(1);
  }
  const py = pythonBin(resolvedHome);
  await mkdir(outDir, { recursive: true });

  let ok = 0;
  for (const raw of jobs) {
    const job = await loadJob(raw, baseDir);
    if (!job.name) {
      console.error("skip: a job has no \"name\"");
      continue;
    }
    const saveDir = join(outDir, `.tmp-${job.name}`);
    await rm(saveDir, { recursive: true, force: true });
    await mkdir(saveDir, { recursive: true });
    const tomlPath = join(saveDir, "job.toml");
    await writeFile(tomlPath, buildToml(job, cfg, saveDir), "utf-8");

    // A stale instruction.txt in the repo root would be read if thinking flips on; clear it.
    await rm(join(resolvedHome, "instruction.txt"), { force: true });

    const fmt = cfg.audioFormat || "mp3";
    process.stdout.write(`▶ ${job.name} (${job.instrumental ? "instrumental" : job.sampleQuery ? "sample" : "song"}, ${job.duration != null ? job.duration + "s" : "auto"}) … `);
    const t0 = Date.now();
    const { code, out } = await run(py, ["cli.py", "-c", tomlPath], {
      cwd: resolvedHome,
      stdio: ["ignore", "pipe", "pipe"], // stdin ignored → the CLI never blocks on input()
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(0);

    if (code !== 0) {
      console.log(`FAILED (exit ${code})`);
      const tail = out.split("\n").filter((l) => /error|traceback|exception/i.test(l)).slice(-4).join("\n   ");
      if (tail) console.error("   " + tail);
      continue;
    }
    const audio = await newestAudio(saveDir);
    if (!audio) {
      console.log("FAILED (no audio produced)");
      continue;
    }
    const dest = join(outDir, `${job.name}.${fmt}`);
    await rename(audio, dest);
    await rm(saveDir, { recursive: true, force: true });
    console.log(`done in ${secs}s → ${dest}`);
    ok++;
  }

  console.log(`\n${ok}/${jobs.length} track(s) generated in ${outDir}  ·  cost $0.00 (local)`);
  process.exit(ok === jobs.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
