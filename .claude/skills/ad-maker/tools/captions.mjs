#!/usr/bin/env node
/**
 * captions.mjs — the house caption spec, shared by faceless.mjs and assemble.mjs.
 *
 * Measured off the reference ad the house captions were matched to: a heavy
 * uppercase sans (Gotham Black), one to three words per card and never more
 * than sixteen characters, a new card whenever the voice pauses longer than
 * 0.45s or a sentence ends, the spoken word highlighted. Both renderers import
 * this file so the look cannot drift between the faceless path and the
 * assembly pass.
 *
 * Captions are always the WRITTEN words (the approved script), timed by the
 * heard ones. The corrections map therefore runs on the transcript, never on
 * the script: it repairs the words a transcriber reliably mangles
 * ("remodellation", "$9.99" for a nine-ninety-nine price) so the alignment
 * lands on them instead of drifting past them. It never rewrites what the
 * script says.
 *
 * Word timing lives here too (whisperStatus / heardWords): local whisper.cpp,
 * no API key, so both renderers time captions the same way.
 *
 *   import { houseFont, fontsDir, chunkCues, applyCorrections, whisperStatus, heardWords } from "./captions.mjs";
 */
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, basename } from "node:path";
import { homedir } from "node:os";

export const HOUSE_FONT = "Gotham Black";
export const FALLBACK_FONT = "Arial Black";
export const MAX_WORDS = 3;
export const MAX_CHARS = 16;
export const PAUSE_BREAK = 0.45;

const FONT_DIRS = [join(homedir(), "Library/Fonts"), "/Library/Fonts"];

/** The folder ffmpeg's subtitles filter should search, or null when the house font is not installed. */
export function fontsDir() {
  return FONT_DIRS.find((d) => existsSync(join(d, "Gotham-Black.otf"))) ?? null;
}

/** "Gotham Black" when its file is on this machine, else the macOS fallback. Say which in the manifest. */
export function houseFont() {
  return fontsDir() ? HOUSE_FONT : FALLBACK_FONT;
}

/**
 * Known transcription artifacts → what the voice actually said. Each was
 * verified by re-transcribing the isolated clip. Keys are lowercase with
 * punctuation stripped. `after` / `before` restrict a fix to a specific
 * neighbouring word, so a real word ("bolts") is only rewritten in the context
 * where it was misheard. `drop: true` removes a word the voice really did
 * stutter but that reads as a typo.
 */
export const CORRECTIONS = {
  remodellation: { to: "remodeling" },
  remodelation: { to: "remodeling" },
  remolishing: { to: "remodeling" },
  edgeability: { to: "eligibility" },
  technics: { to: "technicians" },
  bolts: { to: "bills", after: "heating" },
  billy: { to: "bills", after: "heating" },
  popon: { to: "Pop-On" },
  medicaled: { to: "Medicaid" },
  // A $999 offer is voiced "nine ninety-nine", which whisper renders as "$9.99":
  // a caption that prices a roof at nine dollars. Both spellings come back.
  "$9.99": { to: "$999" },
  "9.99": { to: "$999" },
  // TTS stutter "they built a this $7,000 benefit": "a this" is never valid English.
  a: { drop: true, before: "this" },
  of: { drop: true, after: "built", before: "this" },
};

/** Strip surrounding punctuation, keep internal apostrophes, hyphens, $ and %. */
export const strip = (w) => String(w).trim().replace(/^[^\p{L}\p{N}$]+/u, "").replace(/[^\p{L}\p{N}%]+$/u, "");
const edge = (token, which) => {
  const parts = String(token).trim().split(/\s+/);
  return strip(which === "first" ? parts[0] : parts[parts.length - 1]).toLowerCase();
};

// A transcriber returns two words as one token often enough that a whole-token
// lookup misses them ("just $9.99"). Context-free rules also run inside a merged
// token, on whitespace boundaries so nothing fires on part of a longer word.
function correctMerged(token) {
  let out = token;
  for (const [k, rule] of Object.entries(CORRECTIONS)) {
    if (!rule.to || rule.after || rule.before || rule.drop) continue;
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(^|\\s)${esc}(?=$|[\\s.,!?])`, "gi"), `$1${rule.to}`);
  }
  return out;
}

/** words: [{ text, start, end }] from a transcriber. Returns a corrected copy; never mutates. */
export function applyCorrections(words) {
  return words.map((w, i) => {
    const rule = CORRECTIONS[strip(w.text).toLowerCase()];
    if (!rule) {
      const merged = correctMerged(String(w.text));
      return merged === w.text ? w : { ...w, text: merged };
    }
    if (rule.after && (i === 0 || edge(words[i - 1].text, "last") !== rule.after)) return w;
    if (rule.before && (i === words.length - 1 || edge(words[i + 1].text, "first") !== rule.before)) return w;
    if (rule.drop) return null;
    const trail = String(w.text).match(/[^\p{L}\p{N}%]*$/u)[0];   // keep trailing punctuation
    return { ...w, text: rule.to + trail };
  }).filter(Boolean);
}

const endsSentence = (raw) => /[.!?]["')\]]?\s*$/.test(String(raw));

/**
 * Group timed words into caption cards by the house rules.
 * words: [{ text, start, end }] — the written words with their timings.
 * Each card: { words: [{ text, raw, start, end }], text, raw, start, end }.
 * `text` is punctuation-stripped (the on-screen look); `raw` keeps the script's
 * punctuation for sentence-level plain captions.
 */
export function chunkCues(wordsIn, opts = {}) {
  // Aligned timings can run backwards at a boundary (the next word starting
  // before the previous one ends). Cards built from that overlap on screen, so
  // the stream is made monotonic first: every word starts no earlier than the
  // previous word ends, and lasts at least 50 ms.
  const words = wordsIn.map((w) => ({ ...w }));
  for (let k = 1; k < words.length; k++) {
    if (words[k].start < words[k - 1].end) words[k].start = words[k - 1].end;
    if (words[k].end < words[k].start + 0.05) words[k].end = words[k].start + 0.05;
  }
  const maxWords = opts.maxWords ?? MAX_WORDS;
  const maxChars = opts.maxChars ?? MAX_CHARS;
  const pause = opts.pauseBreak ?? PAUSE_BREAK;
  const cards = [];
  let cur = [], chars = 0;
  // Words first split into runs at the hard breaks (a sentence end, a pause), then each run is
  // divided into the fewest cards that fit, balanced, never ending a card on "a"/"the"/"for"…
  // Greedy filling (the old rule) left "It'll be up in a" / "year." and "He does this for a" /
  // "living." in the 2026-09-13 drama — a lone word flashing as its own subtitle.
  const runs = [];
  let run = [];
  for (const w of words) {
    const text = strip(w.text);
    if (!text) continue;
    const prev = run[run.length - 1];
    if (prev && (w.start - prev.end > pause || prev.breaksAfter)) { runs.push(run); run = []; }
    run.push({ text, raw: String(w.text), start: w.start, end: w.end, breaksAfter: endsSentence(w.text) });
  }
  if (run.length) runs.push(run);
  // A one-word run cut off by a pause (not a sentence end) joins the phrase it belongs to when it fits.
  for (let r = 0; r < runs.length; r++) {
    if (runs[r].length !== 1 || runs.length < 2) continue;
    const w = runs[r][0], before = runs[r - 1], after = runs[r + 1];
    if (before && !before[before.length - 1].breaksAfter) { before.push(w); runs.splice(r--, 1); }
    else if (after && !w.breaksAfter) { after.unshift(w); runs.splice(r--, 1); }
  }
  const out = [];
  for (const rw of runs) for (const g of balanceRun(rw, maxWords, maxChars)) out.push(g);
  for (const g of out) { cur = g; flush(); }
  cards.sort((x, y) => x.start - y.start);
  for (let i = 0; i + 1 < cards.length; i++) if (cards[i].end > cards[i + 1].start) cards[i].end = cards[i + 1].start;
  return cards;
  function flush() {
    // Word timings inside a card must run forward: an aligned token can land
    // before the word ahead of it, and the karaoke events then overlap.
    for (let k = 1; k < cur.length; k++) {
      if (cur[k].start < cur[k - 1].end) cur[k].start = cur[k - 1].end;
      if (cur[k].end < cur[k].start + 0.05) cur[k].end = cur[k].start + 0.05;
    }
    if (cur.length) cards.push({
      words: cur, text: cur.map((w) => w.text).join(" "), raw: cur.map((w) => w.raw).join(" "),
      start: cur[0].start, end: cur[cur.length - 1].end,
    });
    cur = []; chars = 0;
  }
}

const WEAK_END = new Set("a an the to of in on at for and or but nor so my your his her its our their with from by as into than that if".split(" "));

/** Split one run into the fewest cards that fit (or one more, if that avoids a weak break), balanced. */
function balanceRun(run, maxWords, maxChars) {
  const n = run.length, len = (i, j) => run.slice(i, j).reduce((s, w, k) => s + w.text.length + (k ? 1 : 0), 0);
  const fits = (i, j) => j - i === 1 || (j - i <= maxWords && len(i, j) <= maxChars);
  // fewest cards, greedily
  let kMin = 0;
  for (let i = 0; i < n; kMin++) { let j = i + 1; while (j < n && fits(i, j + 1)) j++; i = j; }
  if (kMin <= 1) return [run];
  const total = len(0, n);
  let best = null;
  for (const k of [kMin, kMin + 1]) {
    if (k > n) continue;
    const avg = total / k;
    // dp[m][j] = best cost splitting the first j words into m cards
    const dp = Array.from({ length: k + 1 }, () => Array(n + 1).fill(Infinity)), from = Array.from({ length: k + 1 }, () => Array(n + 1).fill(-1));
    dp[0][0] = 0;
    for (let m = 1; m <= k; m++) for (let j = 1; j <= n; j++) for (let i = m - 1; i < j; i++) {
      if (!Number.isFinite(dp[m - 1][i]) || !fits(i, j)) continue;
      const last = run[j - 1].text.toLowerCase();
      const c = (len(i, j) - avg) ** 2 + (j < n && WEAK_END.has(last) ? 400 : 0) + (j - i === 1 && n >= 3 ? 300 : 0);
      if (dp[m - 1][i] + c < dp[m][j]) { dp[m][j] = dp[m - 1][i] + c; from[m][j] = i; }
    }
    if (!Number.isFinite(dp[k][n])) continue;
    const cost = dp[k][n] + (k - kMin) * 150;
    if (!best || cost < best.cost) {
      const groups = [];
      for (let m = k, j = n; m > 0; m--) { const i = from[m][j]; groups.unshift(run.slice(i, j)); j = i; }
      best = { cost, groups };
    }
  }
  return best ? best.groups : [run];
}

/* ── word timing: local whisper.cpp, no API key ────────────────────────────── */

/**
 * Caption timing runs on this machine. `whisper-cli` (brew install whisper-cpp)
 * reads the clip's own audio and returns one timestamp per word — about a
 * twentieth of real time on Apple silicon, nothing leaves the Mac, nothing is
 * metered. Models live in ~/.adsora/whisper: the house pick is large-v3-turbo
 * (the closest local match to the large-v3 the captions were tuned on), with
 * small.en / base.en as lighter fallbacks.
 *
 *   brew install whisper-cpp
 *   mkdir -p ~/.adsora/whisper && curl -L -o ~/.adsora/whisper/ggml-large-v3-turbo.bin \
 *     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
 *
 * Override per machine with WHISPER_CLI / WHISPER_MODEL, or per jobs file with
 * `whisperModel`. A renderer calls whisperStatus() once at start and passes the
 * result to heardWords() per clip.
 */
export const WHISPER_DIR = join(homedir(), ".adsora/whisper");
export const WHISPER_MODEL_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin";
const WHISPER_PREFERRED = ["ggml-large-v3-turbo.bin", "ggml-small.en.bin", "ggml-base.en.bin"];
const expandTilde = (p) => (typeof p === "string" && p.startsWith("~") ? join(homedir(), p.slice(1)) : p);

/** The whisper-cli binary: WHISPER_CLI, then the usual brew prefixes, then PATH. */
export function whisperBin() {
  for (const b of [expandTilde(process.env.WHISPER_CLI), "/opt/homebrew/bin/whisper-cli", "/usr/local/bin/whisper-cli"])
    if (b && existsSync(b)) return b;
  for (const d of (process.env.PATH || "").split(":")) if (d && existsSync(join(d, "whisper-cli"))) return join(d, "whisper-cli");
  return null;
}

/** The model file: an explicit path (jobs file / WHISPER_MODEL), else the best stock model in WHISPER_DIR. */
export function whisperModel(override) {
  for (const m of [override, process.env.WHISPER_MODEL].map(expandTilde)) if (m && existsSync(m)) return m;
  for (const f of WHISPER_PREFERRED) if (existsSync(join(WHISPER_DIR, f))) return join(WHISPER_DIR, f);
  const any = existsSync(WHISPER_DIR) ? readdirSync(WHISPER_DIR).filter((f) => /^ggml-.*\.bin$/.test(f)).sort() : [];
  return any.length ? join(WHISPER_DIR, any[0]) : null;
}

/** whisper.cpp's -dtw preset for a stock model file (token-level timing), or null for a name it would reject. */
export function dtwPreset(modelPath) {
  const name = basename(modelPath).replace(/^ggml-/, "").replace(/\.bin$/, "").replace(/-q\d.*$/, "");
  const preset = name.replace(/-v(\d)/, ".v$1").replace(/-turbo$/, ".turbo");
  const known = ["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large.v1", "large.v2", "large.v3", "large.v3.turbo"];
  return known.includes(preset) ? preset : null;
}

/** Checked once per run: { ok: true, bin, model, dtw } or { ok: false, reason } with the fix in the reason. */
export function whisperStatus(override) {
  const bin = whisperBin(), model = whisperModel(override);
  if (!bin) return { ok: false, reason: "whisper-cli not found (brew install whisper-cpp)" };
  if (!model) return { ok: false, reason: `no whisper model in ${WHISPER_DIR} (curl -L -o ${join(WHISPER_DIR, "ggml-large-v3-turbo.bin")} ${WHISPER_MODEL_URL})` };
  return { ok: true, bin, model, dtw: dtwPreset(model) };
}

const run = promisify(execFile);
const toSec = (s) => { const [h, m, sec] = String(s ?? "0:0:0").replace(",", ".").split(":"); return +h * 3600 + +m * 60 + +sec; };

/**
 * wav: 16 kHz mono. Returns [{ text, start, end }] in seconds, the shape
 * applyCorrections and the renderers' align() expect. whisper-cli writes
 * <wav minus its extension>.json beside the wav: -ml 1 -sow gives one segment
 * per word, -dtw times tokens by attention alignment instead of the decoder
 * heuristic.
 */
export async function heardWords(wav, status) {
  const st = status?.ok ? status : whisperStatus(status?.model);
  if (!st.ok) throw new Error(st.reason);
  const base = wav.replace(/\.[^./]+$/, "");
  const args = ["-m", st.model, "-f", wav, "-l", "en", "-ml", "1", "-sow", "-oj", "-of", base, "-np"];
  if (st.dtw) args.push("-dtw", st.dtw);
  await run(st.bin, args, { maxBuffer: 1 << 26 });
  const j = JSON.parse(await readFile(`${base}.json`, "utf8"));
  return (j.transcription ?? [])
    .map((s) => ({
      text: String(s.text ?? "").trim(),
      start: s.offsets ? s.offsets.from / 1000 : toSec(s.timestamps?.from),
      end: s.offsets ? s.offsets.to / 1000 : toSec(s.timestamps?.to),
    }))
    .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end));
}
