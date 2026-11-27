#!/usr/bin/env node
/**
 * assemble.mjs — generated clips in, finished ad out. Single file, no build step.
 *
 * This is the edit. The skill runs it itself instead of handing the user a
 * CapCut to-do list. For each job it normalises every clip to one frame size,
 * hard-cuts them in order, lays b-roll cutaways over talking clips, swaps in
 * repaired audio, burns word-timed karaoke captions (the written words, timed by
 * the heard ones), a persistent banner, label overlays and a text end card,
 * mixes a music bed, and writes an MP4. A disclosure line is supported but off
 * by house rule: only set "disclosure" text when the user asks for one.
 *
 *   node assemble.mjs assemble.json            # render every job
 *   node assemble.mjs assemble.json --plan     # durations + timeline only, no render
 *
 * ── SETUP ────────────────────────────────────────────────────────────────────
 *
 *   brew install ffmpeg whisper-cpp
 *   mkdir -p ~/.adsora/whisper && curl -L -o ~/.adsora/whisper/ggml-large-v3-turbo.bin \
 *     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
 *
 * Word timings come from that local whisper.cpp model (captions.mjs: heardWords),
 * so captions cost nothing and need no key. Without whisper-cli or a model,
 * captions still burn, spaced evenly across each clip, and the manifest says so.
 * Captions follow the house spec in captions.mjs: Gotham
 * Black (Arial Black only when it is not installed, and the console says so),
 * 1-3 words and at most 16 characters per card, a new card at a 0.45s pause or
 * a sentence end. Fonts resolve through fontconfig by name plus ~/Library/Fonts.
 *
 * ── JOBS FILE ────────────────────────────────────────────────────────────────
 *
 * {
 *   "outDir":  "./ad-remix-runs/<slug>/06-finals/talking-head",
 *   "aspect":  "9:16",                 // 9:16 (720x1280) · 1:1 (1080x1080) · 16:9 (1280x720)
 *   "size":    "1080x1920",            // optional, overrides the aspect preset
 *   "fps":     24,
 *   "font":    "Gotham Black",         // optional; the house face is the default when installed
 *   "brollPool": "./broll-pool.json",  // optional: screened survivors (tools/broll-pool.mjs) for every `broll` block
 *   "captions":   { "style": "karaoke", "maxWords": 3, "maxChars": 16, "pauseBreak": 0.45, "y": 0.80, "highlight": "#FFE600" },
 *                                      // OPTIONAL. Subtitles are on by default with
 *                                      // exactly these values; the block only tunes them.
 *                                      // "captions": false is the one way to switch them off (job-wide, or on one clip).
 *   "banner":     { "lines": ["BATHROOM", "REMODEL = $1,799"], "y": 0.42, "box": "#D32F2F" },
 *   "disclosure": false,               // house rule: no disclaimer unless the user asks ({ "text", "y": 0.94 } then)
 *   "endCard":    { "lines": ["Comment REMODEL", "for the details"], "seconds": 3 },
 *   "music":      "/abs/path/bed.mp3",  // or "musicDir" to rotate one bed per job
 *   "musicVolume": 0.06,
 *   "jobs": [{
 *     "name": "talking-head-final",
 *     "clips": [
 *       { "file": "05-assets/talking-head/final/clip-t1.mp4",
 *         "script": "Total bathroom renovation for seventeen hundred ninety-nine dollars. Yeah, we're doing it." },
 *       { "file": "05-assets/talking-head/final/clip-t2.mp4", "script": "...",
 *         "broll": { "dir": "~/Documents/Adsora/Video Assets Raw/B-Roll/BATH", "from": 0.8, "to": -1.2, "hold": 2.4 } },
 *       { "file": "05-assets/talking-head/final/clip-t3.mp4", "script": "...", "zoom": 1.08,
 *         "cutaways": [{ "file": "/abs/tile.mp4", "at": 1.0, "seconds": 2.2 }],
 *         "audio": "05-assets/repairs/t3.wav", "ambience": 0.15 },
 *       { "file": "05-assets/broll/finished.mp4", "mute": true, "seconds": 1.0 },
 *       { "split": { "top": "before.png", "bottom": "after.mp4", "seconds": 4, "labels": ["BEFORE", "AFTER"] } },
 *       { "file": "05-assets/product.png", "seconds": 2,
 *         "overlays": [{ "file": "label.png", "x": 120, "y": 640, "w": 480 }],
 *         "text": [{ "text": "REAL LABEL, REAL PRODUCT", "y": 0.12, "size": 44 }] }
 *     ]
 *   }]
 * }
 *
 * Every top-level block (captions, banner, disclosure, endCard, music) can be
 * overridden per job, or switched off per job with `false`. Paths resolve
 * against the working directory; "~" expands.
 *
 * SUBTITLES ARE THE DEFAULT (house rule 23). Every segment that speaks is
 * captioned in its own spoken words, with no `captions` block present. A clip's
 * `script` supplies the written line where you have one (better spelling, and
 * the corrections map can repair it); a clip without a script is captioned from
 * what whisper hears. Muted clips, silent stills and end cards caption nothing.
 * There is no separate authored on-screen-text layer: `text` blocks are for a
 * title card, a caller-ID graphic or a wall of story text, never for restating
 * the voice.
 *
 * Per clip: `file` (video, or a still with `seconds`), `script` (its spoken
 * words → captions; optional, the heard words are used when it is absent),
 * `in`/`out`/`seconds` (trim), `loop` (repeat a short
 * background for `seconds`, or for the length of its `audio` plus `tail`),
 * `mute`, `volume`, `zoom` (punch-in), `fit` ("cover" default, or "pad"),
 * `dim` (0–1 black scrim over the picture so on-screen text stands off it),
 * `blur` (gaussian sigma on the picture, same purpose),
 * `audio` (replace the track; `ambience` keeps the original under it at that
 * gain), `cutaways` (b-roll or a still over this clip, its audio untouched;
 * `region` "full" | "bottom" | "top" | "left" | "right" for a half-frame
 * insert; `captionY` moves the captions that overlap it, for a graphic with its own text), `broll` (auto-tiled cutaways from a folder or a screened `pool`,
 * seeded by the clip's `script` line so the same line draws the same footage in
 * every variant and no clip repeats within the ad; takes `region` too),
 * `overlays` (PNG at x/y/w,
 * optional from/to — see tools/card.mjs for comment / notes / headline cards),
 * `text` (on-screen lines: `y`, `size`, `anchor` top|middle|bottom, `align`
 * center|left|right, `marginX`, `box`, `outline`, `shadow`, `font`, `fill`
 * (0–1: auto-size the type so the whole block spans that share of the frame),
 * `uppercase`, `wrap`, optional from/to — a title card, a caller-ID graphic, a
 * wall of story text), `split` (a before/after stack: two files, optional labels).
 */

import { spawn, execFile } from "node:child_process";
import { mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { basename, join, resolve, dirname } from "node:path";
import { houseFont, fontsDir, chunkCues, applyCorrections, whisperStatus, heardWords, HOUSE_FONT, MAX_WORDS, MAX_CHARS, PAUSE_BREAK } from "./captions.mjs";
import { homedir } from "node:os";

/* ── small helpers ─────────────────────────────────────────────────────────── */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

const expand = (p) => (typeof p === "string" && p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const abs = (p) => (p ? resolve(expand(p)) : p);
const isImage = (f) => /\.(png|jpe?g|webp)$/i.test(f);
const isVideo = (f) => /\.(mp4|mov|m4v|webm)$/i.test(f);
const num = (v, d) => (Number.isFinite(+v) ? +v : d);

function sh(cmd, args, timeoutMs = 120_000) {
  return new Promise((res) =>
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 64 << 20 }, (err, stdout, stderr) =>
      res({ ok: !err, stdout: String(stdout ?? ""), stderr: String(stderr ?? "") })));
}

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
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg ${code}: ${err.slice(-600)}`))));
  });
}

async function probe(file) {
  const r = await sh(FFPROBE, ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height",
    "-of", "json", file], 60_000);
  if (!r.ok) throw new Error(`ffprobe failed on ${file}: ${r.stderr.slice(-200)}`);
  const j = JSON.parse(r.stdout || "{}");
  const v = (j.streams ?? []).find((s) => s.codec_type === "video");
  return {
    duration: num(j.format?.duration, 0),
    width: v?.width ?? 0, height: v?.height ?? 0,
    hasAudio: (j.streams ?? []).some((s) => s.codec_type === "audio"),
  };
}

// Seeded so a job name always draws the same footage order — a rerun reproduces
// the edit instead of quietly becoming a different ad.
function shuffle(arr, seed) {
  const a = arr.slice();
  let s = seed >>> 0 || 1;
  const next = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ── captions: the clip's own audio is transcribed locally (captions.mjs: heardWords),
   and the times are mapped onto the clip's own written words ──────────────── */

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Align written words to heard words by edit distance — not a zip. A transcriber
 * writes "2026" where the script says "twenty twenty-six", splits contractions
 * and drops filler, so pairing word n to word n drifts by one and never recovers.
 * Written words with no heard match get their timing interpolated from the
 * anchors either side: the caption text is always what was written and only
 * the timing is heard.
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
    out[k].end = Math.min(out[k].end, total);
  }
  return out;
}

/* ── ASS: one subtitle file carries captions, banner, disclosure, card, text ── */

const ts = (s) => {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
};
// "#RRGGBB" (+ alpha 0..255, 0 = opaque) → ASS &HAABBGGRR
const assColor = (hex, alpha = 0) => {
  const h = String(hex ?? "#FFFFFF").replace("#", "").padEnd(6, "0").slice(0, 6).toUpperCase();
  return `&H${alpha.toString(16).padStart(2, "0").toUpperCase()}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`;
};
const esc = (t) => String(t).replace(/[{}\\]/g, "").replace(/\r?\n/g, "\\N");

function styleLine(name, o) {
  // Name, Fontname, Fontsize, Primary, Secondary, Outline, Back, Bold, Italic, Underline, StrikeOut,
  // ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
  return `Style: ${name},${o.font},${o.size},${o.primary},${o.secondary ?? o.primary},${o.outline ?? "&H00000000"},` +
    `${o.back ?? "&H00000000"},-1,0,0,0,100,100,0,0,${o.borderStyle ?? 1},${o.outlineW ?? 0},${o.shadow ?? 0},` +
    `${o.align},${o.marginL ?? 40},${o.marginR ?? 40},${o.marginV ?? 0},1`;
}

function buildAss({ w, h, font, styles, events }) {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${w}
PlayResY: ${h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styles.map((s) => styleLine(s.name, { font, ...s })).join("\n")}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.map((e) => `Dialogue: ${e.layer ?? 0},${ts(e.start)},${ts(e.end)},${e.style},,0,0,${e.marginV ?? 0},,${e.text}`).join("\n")}
`;
}

/* ── picture: one normalised segment per clip ─────────────────────────────── */

function fitChain(W, H, fit, zoom) {
  const z = Math.max(1, num(zoom, 1));
  if (fit === "pad" && z === 1)
    return `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`;
  return `scale=${Math.round(W * z)}:${Math.round(H * z)}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
}

// A picture that text has to read over: soften its detail (`blur`, gaussian sigma), then lay a
// black scrim on it (`dim`, 0–1). White type on a dimmed shot is distinct whatever the shot is.
function scrim(pc) {
  const blur = Math.max(0, num(pc.blur, 0)), dim = Math.min(0.95, Math.max(0, num(pc.dim, 0)));
  return (blur ? `,gblur=sigma=${blur}` : "") + (dim ? `,drawbox=x=0:y=0:w=iw:h=ih:color=black@${dim}:t=fill` : "");
}

// Font size (in frame pixels) that lets a text block span `fill` of the frame — the largest size
// whose lines fit the height share and whose longest line fits the width share. `fill` is a number
// (both) or { w, h }. libass sizes type by line pitch, so measured on this renderer: one line of text
// is 1.0 × size tall, an empty line 0.5 × size (`lineHeight` / `blankHeight` override), and a heavy
// sans averages ~0.46 × size per character (Gotham Black 0.46, Helvetica Neue bold 0.43, Arial Black
// 0.41; `charWidth` overrides, default 0.48 keeps a margin). A `size` given alongside `fill` is a cap.
// Returns null when the block has no `fill`.
function fillSize(t, W, H, S) {
  if (t.fill == null || t.fill === false) return null;
  const f = typeof t.fill === "object" ? t.fill : { w: t.fill, h: t.fill };
  const fw = Math.min(1, Math.max(0.1, num(f.w, 0.8))), fh = Math.min(1, Math.max(0.1, num(f.h, 0.8)));
  const lines = String(t.text).split(/\r?\n/);
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const textLines = lines.filter((l) => l.trim()).length, blankLines = lines.length - textLines;
  const cw = num(t.charWidth, 0.48) * (t.uppercase ? 1.08 : 1);
  const units = Math.max(1, textLines * num(t.lineHeight, 1.0) + blankLines * num(t.blankHeight, 0.5));
  let size = Math.floor(Math.min((fw * W) / (longest * cw), (fh * H) / units));
  if (t.size != null) size = Math.min(size, Math.round(num(t.size, 44) * S));
  return { size: Math.max(12, size), marginX: Math.round(((1 - fw) / 2) * W), lines: lines.length, longest };
}

// Where a cutaway lands: the whole frame, or one half of it.
function regionRect(region, W, H) {
  const ev = (v) => Math.round(v / 2) * 2;
  switch (region) {
    case "bottom": return { x: 0, y: ev(H / 2), w: W, h: ev(H / 2) };
    case "top":    return { x: 0, y: 0, w: W, h: ev(H / 2) };
    case "left":   return { x: 0, y: 0, w: ev(W / 2), h: H };
    case "right":  return { x: ev(W / 2), y: 0, w: ev(W / 2), h: H };
    default:       return { x: 0, y: 0, w: W, h: H };
  }
}

function tile(pool, seed, from, to, hold, gap, minLen, used = new Set()) {
  const ok = pool.filter((p) => p.dur >= Math.max(minLen, hold + 0.2));
  // Draw from clips this ad has not shown yet; only when every one has been
  // used does a clip come round again.
  const fresh = ok.filter((p) => !used.has(p.path));
  const usable = shuffle(fresh.length ? fresh : ok, seed);
  const out = [];
  let t = from, k = 0;
  while (usable.length && t + 0.6 < to) {
    const p = usable[k % usable.length];
    used.add(p.path);
    const sec = Math.min(hold, to - t);
    out.push({ file: p.path, at: +t.toFixed(3), seconds: +sec.toFixed(3), in: +Math.max(0, (p.dur - sec) / 2).toFixed(3), auto: true });
    t += sec + gap; k++;
  }
  return out;
}

// A screened pool (tools/broll-pool.mjs): { file } entries relative to the folder
// they were screened in (or to `broll.dir` when given), or absolute.
async function poolFiles(poolPath, baseDir) {
  const p = abs(poolPath);
  const parsed = JSON.parse(await readFile(p, "utf8"));
  const items = Array.isArray(parsed) ? parsed : parsed.clips ?? [];
  const base = baseDir ? abs(baseDir) : dirname(p);
  return items.map((e) => { const f = typeof e === "string" ? e : e.file; return f.startsWith("/") ? f : f.startsWith("~") ? abs(f) : join(base, f); });
}

async function planClip(clip, ctx) {
  const c = { ...clip };
  if (c.split) {
    const top = abs(c.split.top), bottom = abs(c.split.bottom);
    if (!top || !bottom) throw new Error("split needs top and bottom");
    const pt = isImage(top) ? null : await probe(top), pb = isImage(bottom) ? null : await probe(bottom);
    let dur = num(c.split.seconds, 4);
    for (const p of [pt, pb]) if (p?.duration) dur = Math.min(dur, p.duration);
    return { kind: "split", top, bottom, topImg: !top || isImage(top), bottomImg: isImage(bottom), dur, labels: c.split.labels ?? null,
      audio: abs(c.audio), script: c.script, text: c.text ?? [], captions: c.captions };
  }
  const file = abs(c.file);
  if (!file) throw new Error("clip needs a file (or a split)");
  if (isImage(file)) {
    // A still runs for `seconds`, or for its replacement audio plus a tail.
    const dur = c.seconds ? num(c.seconds, 3) : c.audio ? (await probe(abs(c.audio))).duration + num(c.tail, 0.4) : 3;
    return { kind: "still", file, dur, audio: abs(c.audio), script: c.script, captions: c.captions,
      zoom: c.zoom, fit: c.fit, dim: num(c.dim, 0), blur: num(c.blur, 0), overlays: c.overlays ?? [], text: c.text ?? [] };
  }
  if (!isVideo(file)) throw new Error(`not a video or still: ${file}`);
  const p = await probe(file);
  const tIn = Math.max(0, num(c.in, 0));
  const tOut = Math.min(p.duration, num(c.out, p.duration));
  let dur = tOut - tIn;
  const loop = c.loop === true;
  if (loop) {
    // A looped background (a 5s drone shot under a 40s read) runs for `seconds`,
    // or for the length of its replacement audio plus a tail.
    if (c.seconds) dur = num(c.seconds, dur);
    else if (c.audio) dur = (await probe(abs(c.audio))).duration + num(c.tail, 0.4);
  } else if (c.seconds) dur = Math.min(dur, num(c.seconds, dur));
  if (!(dur > 0.05)) throw new Error(`empty trim on ${basename(file)} (in ${tIn}, out ${tOut})`);

  const cutaways = [];
  for (const cw of c.cutaways ?? []) {
    const f = abs(cw.file); if (!f) continue;
    const at = Math.max(0, num(cw.at, 0));
    const sec = Math.min(num(cw.seconds, 2.4), dur - at);
    if (sec > 0.2) cutaways.push({ file: f, at, seconds: +sec.toFixed(3), in: Math.max(0, num(cw.in, 0)), region: cw.region, still: isImage(f), captionY: cw.captionY });
  }
  if (c.broll) {
    const b = c.broll;
    let files = (b.files ?? []).map(abs);
    const poolPath = b.pool ?? ctx.brollPool;
    if (poolPath) files = files.concat(await poolFiles(poolPath, b.dir));
    else if (b.dir) files = files.concat((await readdir(abs(b.dir))).filter(isVideo).map((f) => join(abs(b.dir), f)));
    const exclude = new Set((b.exclude ?? []).map((x) => basename(x)));
    files = files.filter((f) => !exclude.has(basename(f)));
    const pool = await ctx.pool(files);
    const from = Math.max(0, num(b.from, 0.8));
    const toRaw = num(b.to, -1.2);
    const to = Math.min(dur, toRaw <= 0 ? dur + toRaw : toRaw);
    // Seeded by the line, not the job: the same script line draws the same footage in every variant.
    const seed = c.script ? String(c.script).toLowerCase().replace(/\s+/g, " ").trim() : `${ctx.jobName}#${ctx.index}`;
    cutaways.push(...tile(pool, hash(seed), from, to, num(b.hold, 2.4), Math.max(0, num(b.gap, 0)), 1.0, ctx.used)
      .map((t) => ({ ...t, region: b.region })));
  }
  cutaways.sort((a, b) => a.at - b.at);
  return { kind: "video", file, dur, in: tIn, loop, hasAudio: p.hasAudio, mute: !!c.mute, volume: num(c.volume, 1),
    zoom: c.zoom, fit: c.fit, dim: num(c.dim, 0), blur: num(c.blur, 0), audio: abs(c.audio), ambience: num(c.ambience, 0), cutaways,
    overlays: c.overlays ?? [], text: c.text ?? [], script: c.script, captions: c.captions };
}

// A segment lasts a whole number of frames, and its intermediate audio is PCM. Measured 2026-09-13:
// with `-t 3.35` the video floored to 80 frames (3.333 s) while the AAC audio decoded to 3.371 s
// (encoder padding); concat advances by the longer stream, so every cut left a video gap (a one-frame
// stutter) and the picture drifted ~7 ms per cut behind the caption timeline — 0.33 s late after 47
// cuts, with each caption changing before its shot. Frame-exact durations + PCM make all three agree.
const frameDur = (sec, fps) => Math.max(1, Math.round(sec * fps)) / fps;

async function renderSegment(pc, i, ctx) {
  const { W, H, fps, work } = ctx;
  const dest = join(work, `seg-${String(i + 1).padStart(2, "0")}.mov`);
  const args = [];
  const chain = [];
  let n = 0;                 // next input index
  const D = frameDur(pc.dur, fps).toFixed(6);
  // Inputs are read half a second past the cut, the last frame is cloned if a source runs out, and
  // frames are renumbered from 0: a seek to `in` between two source frames started the segment one
  // frame late (start_time 0.041), and the output cut at D then dropped its last frame.
  const DIN = (+D + 0.5).toFixed(3), HOLD = ",tpad=stop_mode=clone:stop_duration=1";
  let vLabel, aLabel;

  if (pc.kind === "split") {
    const half = H >= W ? [W, Math.round(H / 2 / 2) * 2] : [Math.round(W / 2 / 2) * 2, H];
    const add = (file, img) => {
      if (img) args.push("-loop", "1", "-framerate", String(fps), "-t", DIN, "-i", file);
      else args.push("-t", DIN, "-i", file);
      const k = n++;
      chain.push(`[${k}:v]${fitChain(half[0], half[1], "cover", 1)},fps=${fps},setpts=N/FRAME_RATE/TB,setsar=1,format=yuv420p${HOLD}[s${k}]`);
      return `[s${k}]`;
    };
    const a = add(pc.top, pc.topImg), b = add(pc.bottom, pc.bottomImg);
    chain.push(`${a}${b}${H >= W ? "vstack" : "hstack"}=inputs=2[v0]`);
    vLabel = "[v0]";
  } else if (pc.kind === "still") {
    args.push("-loop", "1", "-framerate", String(fps), "-t", DIN, "-i", pc.file); n++;
    chain.push(`[0:v]${fitChain(W, H, pc.fit, pc.zoom)}${scrim(pc)},fps=${fps},setpts=N/FRAME_RATE/TB,setsar=1,format=yuv420p${HOLD}[v0]`);
    vLabel = "[v0]";
  } else {
    if (pc.loop) args.push("-stream_loop", "-1");
    if (pc.in > 0) args.push("-ss", pc.in.toFixed(3));
    args.push("-t", DIN, "-i", pc.file); n++;
    chain.push(`[0:v]${fitChain(W, H, pc.fit, pc.zoom)}${scrim(pc)},fps=${fps},setpts=N/FRAME_RATE/TB,setsar=1,format=yuv420p${HOLD}[v0]`);
    vLabel = "[v0]";
    for (const [k, cw] of pc.cutaways.entries()) {
      // region: the whole frame, or one half of it (a proof clip under the face)
      const r = regionRect(cw.region, W, H);
      if (cw.still) args.push("-loop", "1", "-framerate", String(fps));
      else if (cw.in > 0) args.push("-ss", cw.in.toFixed(3));
      args.push("-t", cw.seconds.toFixed(3), "-i", cw.file);
      const idx = n++;
      chain.push(`[${idx}:v]${fitChain(r.w, r.h, "cover", 1)},fps=${fps},setsar=1,format=yuv420p,setpts=PTS-STARTPTS+${cw.at.toFixed(3)}/TB[c${k}]`);
      chain.push(`${vLabel}[c${k}]overlay=${r.x}:${r.y}:eof_action=pass:enable='between(t,${cw.at.toFixed(3)},${(cw.at + cw.seconds).toFixed(3)})'[v${k + 1}]`);
      vLabel = `[v${k + 1}]`;
    }
  }

  // PNG overlays (a real product label, a logo) — looped so they persist.
  for (const [k, ov] of (pc.overlays ?? []).entries()) {
    const f = abs(ov.file); if (!f) continue;
    const from = Math.max(0, num(ov.from, 0)), to = Math.min(pc.dur, num(ov.to, pc.dur));
    if (to - from <= 0) continue;
    args.push("-loop", "1", "-framerate", String(fps), "-t", (to - from).toFixed(3), "-i", f);
    const idx = n++;
    const scale = ov.w ? `scale=${Math.round(ov.w)}:-1,` : "";
    chain.push(`[${idx}:v]${scale}format=rgba,setpts=PTS-STARTPTS+${from.toFixed(3)}/TB[o${k}]`);
    chain.push(`${vLabel}[o${k}]overlay=${Math.round(num(ov.x, 0))}:${Math.round(num(ov.y, 0))}:eof_action=pass:enable='between(t,${from.toFixed(3)},${to.toFixed(3)})'[ov${k}]`);
    vLabel = `[ov${k}]`;
  }

  // Audio: a replacement track, silence, or the clip's own.
  const srcAudio = pc.kind === "video" && pc.hasAudio && !pc.mute;
  if (pc.audio) {
    args.push("-i", pc.audio);
    const idx = n++;
    chain.push(`[${idx}:a]aresample=48000,aformat=channel_layouts=stereo[ra]`);
    if (srcAudio && pc.ambience > 0) {
      chain.push(`[0:a]volume=${pc.ambience},aresample=48000,aformat=channel_layouts=stereo[oa]`);
      chain.push(`[ra][oa]amix=inputs=2:duration=first:normalize=0,apad[a]`);
    } else chain.push(`[ra]apad[a]`);
  } else if (srcAudio) {
    chain.push(`[0:a]volume=${pc.volume},aresample=48000,aformat=channel_layouts=stereo,apad[a]`);
  } else {
    args.push("-f", "lavfi", "-t", D, "-i", "anullsrc=r=48000:cl=stereo");
    chain.push(`[${n++}:a]anull[a]`);
  }
  aLabel = "[a]";

  await ff([...args, "-filter_complex", chain.join(";"), "-map", vLabel, "-map", aLabel,
    "-t", D, "-frames:v", String(Math.round(D * fps)), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", dest]);
  return dest;
}

async function renderCard(card, i, ctx) {
  const { W, H, fps, work } = ctx;
  const dest = join(work, `seg-${String(i + 1).padStart(2, "0")}-card.mov`);
  const D = frameDur(num(card.seconds, 3), fps).toFixed(6);
  const bg = String(card.bg ?? "#000000").replace("#", "0x");
  await ff(["-f", "lavfi", "-t", D, "-i", `color=c=${bg}:s=${W}x${H}:r=${fps}`,
    "-f", "lavfi", "-t", D, "-i", "anullsrc=r=48000:cl=stereo",
    "-map", "0:v", "-map", "1:a", "-t", D, "-frames:v", String(Math.round(D * fps)), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", dest]);
  return dest;
}

/* ── main ──────────────────────────────────────────────────────────────────── */

async function main() {
  const cfgPath = process.argv[2];
  const planOnly = process.argv.includes("--plan");
  if (!cfgPath) { console.error("usage: node assemble.mjs <assemble.json> [--plan]"); process.exit(1); }
  const cfg = JSON.parse(await readFile(cfgPath, "utf8"));

  const whisper = whisperStatus(cfg.whisperModel);      // local whisper.cpp for caption timing; no key, no spend
  const outDir = resolve(expand(cfg.outDir) || "./out");
  const preset = cfg.aspect === "16:9" ? [1280, 720] : cfg.aspect === "1:1" ? [1080, 1080] : [720, 1280];
  const [W, H] = cfg.size ? String(cfg.size).split("x").map((v) => Math.round(+v / 2) * 2) : preset;
  const fps = num(cfg.fps, 24);
  const font = cfg.font ?? houseFont();
  if (houseFont() !== HOUSE_FONT) console.warn(`captions in ${font} — the house face ${HOUSE_FONT} is not installed on this machine`);
  else if (font !== HOUSE_FONT) console.log(`captions in ${font} (jobs file override; the house face is ${HOUSE_FONT})`);
  const fontsOpt = fontsDir() ? `:fontsdir='${fontsDir().replace(/([:'\\])/g, "\\$1")}'` : "";
  const S = H / 1280;                                   // scale factor for type sizes
  const music = cfg.musicDir
    ? (await readdir(abs(cfg.musicDir))).filter((f) => /\.(mp3|m4a|wav|aac)$/i.test(f)).sort().map((f) => join(abs(cfg.musicDir), f))
    : [];

  const durCache = new Map();
  const pool = async (files) => {
    const q = files.filter((f) => !durCache.has(f));
    await Promise.all(Array.from({ length: 8 }, async () => {
      for (;;) { const p = q.shift(); if (!p) return; try { durCache.set(p, (await probe(p)).duration); } catch { durCache.set(p, 0); } }
    }));
    return files.map((f) => ({ path: f, dur: durCache.get(f) ?? 0 })).filter((p) => p.dur > 0);
  };

  const pick = (key, job) => (job[key] === false ? null : job[key] ?? cfg[key] ?? null);
  const results = [];
  if (!whisper.ok) console.warn(`${whisper.reason} — captions will be spaced evenly, not timed to speech`);
  else console.log(`caption timing: whisper.cpp ${basename(whisper.model)}${whisper.dtw ? " +dtw" : ""}`);

  for (const [jdx, job] of (cfg.jobs ?? []).entries()) {
    const tag = `[${jdx + 1}/${cfg.jobs.length}] ${job.name}`;
    const work = join(outDir, ".work", job.name);
    try {
      if (!job.name) throw new Error("job needs a name");
      if (!job.clips?.length) throw new Error("job has no clips");
      await mkdir(work, { recursive: true });
      const ctx = { W, H, fps, work, jobName: job.name, pool, brollPool: job.brollPool ?? cfg.brollPool ?? null, used: new Set() };

      // 1. plan
      const plan = [];
      for (const [i, clip] of job.clips.entries()) plan.push(await planClip(clip, { ...ctx, index: i }));
      const card = pick("endCard", job);
      if (card?.lines?.length) plan.push({ kind: "card", dur: num(card.seconds, 3), card });
      const total = plan.reduce((s, p) => s + p.dur, 0);
      console.log(`${tag} — ${plan.length} segments, ${total.toFixed(1)}s`);
      for (const [i, p] of plan.entries()) {
        const what = p.kind === "card" ? "end card" : p.kind === "split" ? `split ${basename(p.top)} / ${basename(p.bottom)}` : basename(p.file);
        const extras = [p.loop ? "loop" : "", p.cutaways?.length ? `${p.cutaways.length} cutaways` : "", p.audio ? "audio swap" : "", p.script ? "script" : "", p.dim ? `dim ${p.dim}` : "", p.blur ? `blur ${p.blur}` : "",
          p.text?.length ? `${p.text.length} text` + p.text.map((t) => { const f = fillSize(t, W, H, S); return f ? ` (fill → ${f.size}px, ${f.lines} lines, longest ${f.longest} ch)` : ""; }).join("") : ""].filter(Boolean).join(", ");
        console.log(`   ${String(i + 1).padStart(2)}  ${p.dur.toFixed(2).padStart(6)}s  ${what}${extras ? "  (" + extras + ")" : ""}`);
      }
      if (planOnly) { results.push({ name: job.name, ok: true, planned: true, seconds: +total.toFixed(2) }); continue; }

      // 2. segments
      const segs = [];
      for (const [i, p] of plan.entries())
        segs.push(p.kind === "card" ? await renderCard(p.card, i, ctx) : await renderSegment(p, i, ctx));
      const segDur = [];
      for (const p of plan) segDur.push(frameDur(p.dur, ctx.fps));
      const offsets = segDur.map((_, i) => segDur.slice(0, i).reduce((a, b) => a + b, 0));
      const T = segDur.reduce((a, b) => a + b, 0);

      // 3. words → captions, plus every other on-screen element, in one ASS
      // Subtitles are on by default (house rule 23): the house caption spec
      // applies with no `captions` block in the jobs file, and `"captions": false`
      // is the only way off.
      const capRaw = job.captions ?? cfg.captions ?? {};
      const capCfg = capRaw === false ? null : capRaw;
      const styles = [], events = [];
      const capStyle = capCfg?.style ?? "karaoke";
      const capOpts = { maxWords: num(capCfg?.maxWords ?? capCfg?.wordsPerCue, MAX_WORDS), maxChars: num(capCfg?.maxChars, MAX_CHARS), pauseBreak: num(capCfg?.pauseBreak, PAUSE_BREAK) };
      const capSize = Math.round(num(capCfg?.size, 58) * S);
      const capMarginV = Math.round((1 - num(capCfg?.y, 0.8)) * H);
      const upper = capCfg?.uppercase !== false;
      const hi = assColor(capCfg?.highlight ?? "#FFE600"), base = assColor(capCfg?.color ?? "#FFFFFF");
      styles.push({ name: "Cap", size: capSize, primary: capStyle === "fill" ? hi : base, secondary: base,
        outline: "&H00000000", back: "&H00000000", borderStyle: 1, outlineW: Math.max(2, Math.round(5 * S)), shadow: Math.round(2 * S), align: 2, marginL: 50, marginR: 50, marginV: capMarginV });
      let captionTiming = capCfg ? (whisper.ok ? "local" : "even") : "none";
      const clipsOut = [];
      for (const [i, p] of plan.entries()) {
        const rec = { file: p.file ? basename(p.file) : p.kind, start: +offsets[i].toFixed(2), seconds: +segDur[i].toFixed(2) };
        if (p.cutaways?.length) rec.cutaways = p.cutaways.map((c) => ({ file: basename(c.file), at: c.at, seconds: c.seconds }));
        // A segment speaks if it kept its own track or was given one. Its words
        // get subtitled either way: `script` is the written line where we have
        // one, and whisper supplies the words where we do not.
        const speaks = p.kind === "video" ? (!p.mute && (p.hasAudio || p.audio)) : !!p.audio;
        // A clip may opt out on its own (`"captions": false` on the clip): a screen
        // capture whose form fields are the information (funnel-walkthrough.md).
        if (capCfg && p.captions !== false && (p.script || speaks)) {
          const written = p.script ? String(p.script).replace(/\s+/g, " ").trim().split(" ").filter(Boolean) : [];
          let heard = [];
          if (whisper.ok) {
            const wav = join(work, `seg-${String(i + 1).padStart(2, "0")}.wav`);
            try {
              await ff(["-i", segs[i], "-vn", "-ac", "1", "-ar", "16000", "-y", wav]);
              heard = applyCorrections(await heardWords(wav, whisper));
              rec.heard = heard.map((w) => w.text).join(" ");
            } catch (e) {
              // no audio stream, or whisper stumbled: a written line still gets
              // evenly spaced cards, an unscripted clip simply carries none.
              if (written.length) { console.warn(`   captions for segment ${i + 1}: ${e.message} — spacing evenly`); captionTiming = "mixed"; }
            }
          }
          // Unscripted: the heard words already carry their own timing.
          const words = written.length ? align(written, heard, segDur[i]) : heard;
          for (const cue of chunkCues(words, capOpts)) {
            // uppercase cards show the stripped word; sentence-level plain captions keep the script's punctuation
            const txt = (w) => esc(upper ? w.text.toUpperCase() : w.raw);
            const st = offsets[i] + cue.start, en = offsets[i] + cue.end;
            // A cutaway graphic with its own text (an approval screen, a notes card) can move the
            // captions that overlap it out of its layout: `"captionY": 0.88` on that cutaway.
            const over = (p.cutaways ?? []).find((cw) => cw.captionY != null && cue.start < cw.at + cw.seconds && cue.end > cw.at);
            const mv = over ? { marginV: Math.round((1 - num(over.captionY, 0.88)) * H) } : {};
            if (capStyle === "plain") {
              events.push({ style: "Cap", start: st, end: en, ...mv, text: cue.words.map((w) => txt(w)).join(" ") });
            } else if (capStyle === "fill") {
              // \k: each word fills from Secondary to Primary as it is spoken, cumulatively
              const parts = cue.words.map((w, k) => {
                const nextStart = k + 1 < cue.words.length ? cue.words[k + 1].start : cue.end;
                return `{\\k${Math.max(1, Math.round((nextStart - w.start) * 100))}}${txt(w)}`;
              });
              events.push({ style: "Cap", start: st, end: en, ...mv, text: parts.join(" ") });
            } else {
              // karaoke: one event per word; only the active word is highlighted
              for (const [k, w] of cue.words.entries()) {
                const ws = offsets[i] + (k === 0 ? cue.start : w.start);
                const we = offsets[i] + (k + 1 < cue.words.length ? cue.words[k + 1].start : cue.end);
                if (we - ws <= 0.01) continue;
                const text = cue.words.map((x, j) => (j === k ? `{\\c${hi}&}${txt(x)}{\\c${base}&}` : txt(x))).join(" ");
                events.push({ style: "Cap", start: ws, end: we, ...mv, text });
              }
            }
          }
        }
        // split labels + free text ride on the same file
        // BorderStyle 3 (opaque box) takes its box colour from OutlineColour, not BackColour.
        if (p.kind === "split" && p.labels?.length) {
          if (!styles.some((s) => s.name === "Label"))
            styles.push({ name: "Label", size: Math.round(40 * S), primary: assColor("#FFFFFF"), outline: assColor("#000000", 0x60), back: assColor("#000000", 0x60), borderStyle: 3, outlineW: Math.round(10 * S), align: 8, marginV: 0 });
          const [l1, l2] = p.labels;
          const pos = H >= W ? [Math.round(0.03 * H), Math.round(0.53 * H)] : [Math.round(0.04 * H), Math.round(0.04 * H)];
          if (l1) events.push({ style: "Label", start: offsets[i], end: offsets[i] + segDur[i], marginV: pos[0], text: esc(l1) });
          if (l2 && H >= W) events.push({ style: "Label", start: offsets[i], end: offsets[i] + segDur[i], marginV: pos[1], text: esc(l2) });
        }
        for (const [k, t] of (p.text ?? []).entries()) {
          const name = `Txt${i}_${k}`;
          const boxCol = t.box ? assColor(t.box, num(t.boxAlpha, 0)) : "&H00000000";
          // anchor = where `y` is measured from: top (default), bottom, or middle (centred, `y` ignored)
          const anchor = t.anchor ?? "top", side = t.align ?? "center";
          const align = (anchor === "bottom" ? 1 : anchor === "middle" ? 4 : 7) + (side === "left" ? 0 : side === "right" ? 2 : 1);
          const marginV = anchor === "bottom" ? Math.round((1 - num(t.y, 0.88)) * H) : anchor === "middle" ? 0 : Math.round(num(t.y, 0.12) * H);
          // `fill`: size the type from the hand-written line breaks so the whole block spans that share of
          // the frame — a wall of story text at 0.8 covers 80% of a phone screen; margins follow the width share.
          const fit = fillSize(t, W, H, S);
          const mx = fit ? fit.marginX : Math.round(num(t.marginX, 40) * S);
          styles.push({ name, ...(t.font ? { font: t.font } : {}), size: fit ? fit.size : Math.round(num(t.size, 44) * S), primary: assColor(t.color ?? "#FFFFFF"),
            outline: t.box ? boxCol : assColor(t.outlineColor ?? "#000000"), back: boxCol, borderStyle: t.box ? 3 : 1,
            outlineW: t.box ? Math.round(num(t.pad, 12) * S) : Math.round(num(t.outline, 4) * S),
            shadow: t.box ? 0 : Math.round(num(t.shadow, 2) * S), align, marginL: mx, marginR: mx, marginV });
          const from = offsets[i] + Math.max(0, num(t.from, 0)), to = offsets[i] + Math.min(segDur[i], num(t.to, segDur[i]));
          // \q0 wraps long lines evenly inside the margins; explicit line breaks still hold
          const body = esc(t.uppercase ? String(t.text).toUpperCase() : t.text);
          events.push({ style: name, start: from, end: to, text: (t.wrap === false ? "{\\q2}" : "{\\q0}") + body });
        }
        if (p.kind === "card") {
          styles.push({ name: "Card", size: Math.round(num(p.card.size, 60) * S), primary: assColor(p.card.color ?? "#FFFFFF"),
            outline: "&H00000000", borderStyle: 1, outlineW: Math.round(3 * S), shadow: 0, align: 5, marginL: 60, marginR: 60 });
          events.push({ style: "Card", start: offsets[i], end: offsets[i] + segDur[i], text: p.card.lines.map(esc).join("\\N") });
        }
        clipsOut.push(rec);
      }

      const banner = pick("banner", job);
      if (banner?.lines?.length) {
        // stays off the end card unless onCard: true — the card carries its own text
        const bodyEnd = plan[plan.length - 1].kind === "card" && banner.onCard !== true ? offsets[plan.length - 1] : T;
        const boxCol = assColor(banner.box ?? "#D32F2F", num(banner.boxAlpha, 0x10));
        styles.push({ name: "Banner", size: Math.round(num(banner.size, 46) * S), primary: assColor(banner.color ?? "#FFFFFF"),
          outline: boxCol, back: boxCol, borderStyle: 3, outlineW: Math.round(14 * S), shadow: 0,
          align: 8, marginV: Math.round(num(banner.y, 0.42) * H) });
        events.push({ style: "Banner", start: 0, end: bodyEnd, text: banner.lines.map(esc).join("\\N") });
      }
      const disc = pick("disclosure", job);
      if (disc?.text) {
        const bodyEnd = plan[plan.length - 1].kind === "card" ? offsets[plan.length - 1] : T;
        styles.push({ name: "Disc", size: Math.round(num(disc.size, 20) * S), primary: assColor(disc.color ?? "#FFFFFF", 0x20),
          outline: assColor("#000000", 0x70), back: assColor("#000000", 0x70), borderStyle: 3, outlineW: Math.round(6 * S), shadow: 0,
          align: 2, marginV: Math.round((1 - num(disc.y, 0.94)) * H) });
        events.push({ style: "Disc", start: 0, end: bodyEnd, text: esc(disc.text) });
      }
      const assPath = join(work, `${job.name}.ass`);
      await writeFile(assPath, buildAss({ w: W, h: H, font, styles, events }), "utf8");

      // 4. concat + burn + music, one pass
      const args = [];
      for (const s of segs) args.push("-i", s);
      const bed = (() => {
        const m = pick("music", job);
        if (typeof m === "string") return abs(m);
        return music.length ? music[jdx % music.length] : null;
      })();
      if (bed) args.push("-i", bed);
      const cat = segs.map((_, i) => `[${i}:v][${i}:a]`).join("") + `concat=n=${segs.length}:v=1:a=1[cv][ca]`;
      const subs = assPath.replace(/([:'\\])/g, "\\$1");
      const vol = num(pick("musicVolume", job), 0.06);
      const fadeOut = Math.max(0.1, T - 0.8);
      const audio = bed
        ? `[ca]apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[v1];` +
          `[${segs.length}:a]aresample=48000,aloop=loop=-1:size=2147483647,atrim=0:${T.toFixed(2)},volume=${vol},` +
          `afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOut.toFixed(2)}:d=0.8[v2];[v1][v2]amix=inputs=2:duration=first:normalize=0[a]`
        : `[ca]anull[a]`;
      const dest = join(outDir, `${job.name}.mp4`);
      await ff([...args, "-filter_complex", `${cat};[cv]subtitles='${subs}'${fontsOpt}[v];${audio}`,
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
        "-t", T.toFixed(3), "-y", dest]);
      if (cfg.keepWork !== true) for (const s of segs) await rm(s, { force: true });

      console.log(`${tag} ✓ ${basename(dest)} (${T.toFixed(1)}s)`);
      results.push({ name: job.name, file: dest, seconds: +T.toFixed(2), frame: `${W}x${H}`, captionTiming, clips: clipsOut, ok: true });
    } catch (e) {
      console.error(`${tag} ✗ ${e.message}`);
      results.push({ name: job.name, ok: false, error: e.message });
    }
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, planOnly ? "plan.json" : "manifest.json"), JSON.stringify(results, null, 2));
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} ${planOnly ? "planned" : "assembled"}${planOnly ? "" : " into " + outDir}`);
  if (!ok) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
