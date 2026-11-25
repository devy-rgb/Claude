#!/usr/bin/env node
/**
 * qa.mjs — the three gates. Rules in markdown did not stop a British street
 * interview or a 144-second drama from shipping; files that refuse to pass do.
 *
 *   node tools/qa.mjs lint  <jobs.json> [more.json ...] [--accent "<non-US accent>"]
 *   node tools/qa.mjs clips <jobs.json | clip.mp4 ...>   [--script lines.txt] [--accent "..."]
 *   node tools/qa.mjs trim  <jobs.json | clip.mp4 ...>   [--script lines.txt]   → trims.json
 *   node tools/qa.mjs final <assemble.json> [--source-seconds 45] [--max-seconds 90] [--format <name>]
 *
 * Exit 0 = PASS (warnings allowed) · 1 = FAIL · 2 = usage. Each gate writes
 * qa-<gate>.json beside its input. Everything is local and free: whisper.cpp for
 * transcripts, a CommonAccent ECAPA classifier for accent (tools/accent_check.py).
 *
 * ── GATE 1 · lint — BEFORE any money is spent ────────────────────────────────
 * Reads the prompts in an Adsora Gen / Evolink jobs file.
 *   DIALECT        a HARD British term in any prompt (pavement, car park, flat cap,
 *                  high street, shopfront, building site…) → FAIL with the American
 *                  word. SOFT spelling variants (colour, grey…) → WARN.
 *                  Why: those words make the image model draw a UK street, and an
 *                  i2v clip voices the place it sees (qa-dialect.json).
 *   VOICE-FOREIGN  "mid-Atlantic", "British", "RP"… in a prompt → FAIL.
 *   ACCENT-MISSING a clip with a spoken line and no "American" → FAIL.
 *   ACCENT-REGION  "American" with no named US region → FAIL. Measured: an unmarked
 *                  "General American" came back British 3/3 on a non-US frame; a
 *                  named region ("Upper-Midwest", "Southern") held 4/4 on the same frame.
 *   LINE-COUNT     more than one separately quoted line in one clip → FAIL. Each clip
 *                  carries exactly one line so the edit cuts on clip boundaries, not on
 *                  word timings guessed inside a take.
 *   PROMPT-LEAK    "They say:" or an ALL-CAPS label right before the quote → FAIL
 *                  (the model speaks it). "He says:" / "She says:" / a bare quote are fine.
 *   SHORT-LINE     ≤ 6 words in a clip ≥ 5 s → WARN: H3 repeats a short line to fill its
 *                  5.2 s floor; the edit must trim to the first reading.
 *   IDENTITY       the same ≥ 60-char character description in 2+ stills, and a later
 *                  still without image_urls → FAIL. Three stills generated from text alone
 *                  gave three different interviewers.
 *   LOCALE         an exterior still or clip with no American locale anchor → WARN.
 *   PROMPT-DUP     the same long sentence twice in one prompt (a stale description pasted in
 *                  beside the new one while templating) → FAIL.
 *
 * ── trim — between generation and gate 2 ─────────────────────────────────────
 *   One line per clip means one unambiguous trim: align the clip's word timings to its
 *   script and cut to the FIRST complete reading (first word − 0.10 s → that reading's
 *   last word + 0.25 s). A short line spoken twice to fill the clip keeps only the first
 *   reading; unscripted words before the line fall outside the window. Writes trims.json
 *   ({ "<clip>.mp4": { in, seconds } }). Pass it to `clips --trims` so gate 2 judges the
 *   window the edit will use, and copy the same in/seconds into assemble.json.
 *   (tools/speech-end.py finds the last SOUND, which on a repeated line is the second
 *   reading — the wrong cut.)
 *
 * ── GATE 2 · clips — AFTER generation (and trim), BEFORE assembly ────────────
 *   ACCENT         North-American margin < +0.10 on any clip with speech → FAIL. A clip with under
 *                  2.5 s of speech is judged pooled with every clip sharing its voice line
 *                  (the classifier is noise on a one-word line); longer clips are judged alone too.
 *   MISSING        < 85% of the scripted words heard, or the line's first or last word gone → FAIL.
 *   REPEAT         the scripted line heard twice in one clip → FAIL.
 *   HEAD-LEAK      2+ unscripted words before the line starts → FAIL.
 *   With --trims, every check runs on the trimmed window only.
 *
 * ── GATE 3 · final — AFTER assembly, BEFORE delivery ─────────────────────────
 *   RUNTIME        longer than source × 1.35 (or --max-seconds, default 90) → FAIL. Formats whose
 *                  module declares a long band are held to it: drama 90–200 s, funnel 60–190 s.
 *   MICRO-CUT      a spoken segment under 1.2 s cut from a take that feeds other segments → FAIL
 *                  (a one-line clip trimmed to its own speech is fine at any length).
 *   SLICED-TAKE    one clip file cut into 3+ segments → FAIL.
 *   DUPLICATE      the same heard line in two segments, or twice inside one → FAIL.
 *   DEAD-AIR       a silent segment > 1.0 s between spoken ones → WARN.
 *   MUSIC          a bed from OUTSIDE the house Soundtracks pool that is not a song.mjs
 *                  output and not listed in a LICENSES.json beside it → FAIL. Every track
 *                  in the pool is cleared by the operator.
 *   DISCLOSURE     not false → FAIL (hard rule 14).
 *   CAPTIONS       off the house spec without "captionsException" → WARN.
 *   VOICE-DRIFT    a character whose lines don't sound like one person (median speaker similarity
 *                  < 0.40; one real person 0.42–0.53, separately generated lines 0.28) → FAIL.
 *   LOUDNESS       adjacent spoken lines more than 6 dB apart → FAIL (4–6 dB → WARN).
 *   ROOM-TONE      the background floor jumps more than 6 dB at a cut → FAIL.
 *   PACING         median pause between speakers > 0.6 s, or any pause > 1.2 s → WARN.
 *   VOICE-CONFUSION two characters who sound like one person (cross similarity ≥ 0.40) → FAIL.
 *                  These need "speaker" on each assemble clip (tools/audio_check.py).
 *   CUT-DRIFT      detected shot changes > 0.08 s off the caption timeline by the end → FAIL.
 *   CAPTION-COLLISION a caption band that lands on a still cutaway's own text → FAIL ("captionY").
 *   ACCENT         re-checked on every spoken source clip with no passing qa-clips.json.
 */

import { readFile, writeFile, access, mkdtemp, rm } from "node:fs/promises";
import { dirname, join, resolve, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { whisperStatus, heardWords } from "./captions.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const DIALECT = JSON.parse(await readFile(join(HERE, "qa-dialect.json"), "utf8"));
const ACCENT_PY = process.env.ACCENT_PYTHON || join(homedir(), ".adsora/accent/bin/python");
const exists = (p) => access(p).then(() => true, () => false);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (text, term) => new RegExp(`(^|[^\\p{L}])${esc(term)}([^\\p{L}]|$)`, "iu").test(text);
// Numbers are spoken as words in scripts ("ten grand") and written as digits by whisper ("10
// grand"); fold both to digits so a transcript is never marked short over spelling.
const ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
function foldNumbers(s) {
  const toks = s.split(" "), out = [];
  for (let i = 0; i < toks.length; i++) {
    let w = toks[i], n = null;
    if (w in TENS) { n = TENS[w]; if (toks[i + 1] in ONES && ONES[toks[i + 1]] < 10) { n += ONES[toks[i + 1]]; i++; } }
    else if (w in ONES) n = ONES[w];
    if (n !== null && (toks[i + 1] === "hundred" || toks[i + 1] === "thousand")) { n *= toks[i + 1] === "hundred" ? 100 : 1000; i++; }
    out.push(n === null ? w : String(n));
  }
  return out.join(" ");
}
const norm = (s) => foldNumbers(String(s).toLowerCase().replace(/(\d),(\d{3})/g, "$1$2").replace(/-/g, " ").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim());
const words = (s) => norm(s).split(" ").filter(Boolean);

// A spoken line is a quoted run with at least two words and a letter — not "no logo cube".
const spokenLines = (p) =>
  [...String(p).matchAll(/"([^"]{2,})"/g)].map((m) => m[1]).filter((q) => /\p{L}/u.test(q) && words(q).length >= 1)
    .filter((q) => !/^(no |a |an |the )?(logo|label|text|sign)/i.test(q));

/* ── reporting ─────────────────────────────────────────────────────────────── */
function report(gate, items, outPath) {
  const fails = items.filter((i) => i.level === "FAIL"), warns = items.filter((i) => i.level === "WARN");
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\nqa ${gate} — ${fails.length ? "FAIL" : "PASS"}  (${fails.length} fail, ${warns.length} warn)`);
  // Collapse identical findings across jobs into one line, so one repeated word cannot bury the real failures.
  const groups = new Map();
  for (const i of [...fails, ...warns]) {
    const k = `${i.level}|${i.check}|${i.msg}`;
    if (!groups.has(k)) groups.set(k, { ...i, wheres: [] });
    groups.get(k).wheres.push(i.where);
  }
  for (const g of groups.values()) {
    const w = g.wheres.length === 1 ? g.wheres[0] : `${g.wheres.length} clips: ${g.wheres.map((x) => x.split(":").pop()).join(", ")}`;
    console.log(`  ${pad(g.level, 4)} ${pad(g.check, 14)} ${g.msg}\n       ${" ".repeat(14)} ↳ ${w}`);
  }
  const out = { gate, verdict: fails.length ? "FAIL" : "PASS", fails: fails.length, warns: warns.length, ran: new Date().toISOString(), items };
  return writeFile(outPath, JSON.stringify(out, null, 2)).then(() => { console.log(`  → ${outPath}`); return out; });
}

/* ── accent (shared by gates 2 and 3) ──────────────────────────────────────── */
async function accentCheck(files) {
  if (!files.length) return new Map();
  if (!(await exists(ACCENT_PY))) throw new Error(`accent venv missing at ${ACCENT_PY} — see tools/accent_check.py for the two-line setup`);
  const { stdout } = await run(ACCENT_PY, [join(HERE, "accent_check.py"), ...files], { maxBuffer: 1 << 24, timeout: 20 * 60e3 });
  const m = new Map();
  for (const line of stdout.split("\n")) { try { const j = JSON.parse(line); m.set(j.file, j); } catch {} }
  return m;
}

async function transcribe(file, whisper, win) {
  const dir = await mkdtemp(join(tmpdir(), "qa-"));
  try {
    const wav = join(dir, "a.wav");
    const cut = win ? ["-ss", String(win.in), "-t", String(win.seconds)] : [];
    await run("ffmpeg", ["-v", "error", "-y", ...cut, "-i", file, "-vn", "-ac", "1", "-ar", "16000", "-af", "apad=pad_dur=0.6", wav]);
    return (await heardWords(wav, whisper)).map((w) => w.text).join(" ");
  } catch { return null; } finally { await rm(dir, { recursive: true, force: true }); }
}

/* ── word-timed transcripts and first-reading alignment ─────────────────────── */
async function timedWords(file, whisper, win) {
  const dir = await mkdtemp(join(tmpdir(), "qa-"));
  try {
    const wav = join(dir, "a.wav");
    const cut = win ? ["-ss", String(win.in), "-t", String(win.seconds)] : [];
    await run("ffmpeg", ["-v", "error", "-y", ...cut, "-i", file, "-vn", "-ac", "1", "-ar", "16000", wav]);
    return { wav: null, words: (await heardWords(wav, whisper)).flatMap((w) => {
      const parts = words(w.text); if (!parts.length) return [];
      const step = (w.end - w.start) / parts.length;       // a token folded to 2 words ("twenty two") shares its span
      return parts.map((x, k) => ({ w: x, start: w.start + k * step, end: w.start + (k + 1) * step }));
    }) };
  } catch { return { words: null }; } finally { await rm(dir, { recursive: true, force: true }); }
}
const near = (a, b) => {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;            // "you"≠"your", "no"≠"now": short words match exactly
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 5) return false;
  let i = 0, j = 0, edits = 0;                                   // one-edit distance, 5+ letters
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return edits + (a.length - i) + (b.length - j) <= 1;
};
// Earliest, most complete in-order match of the script's words inside the heard words.
function firstReading(scriptWords, heard) {
  const walk = (s, k0) => {
    let k = k0, last = s, j = s + 1, gap = 0;
    while (k < scriptWords.length && j < heard.length && gap <= 2) {
      if (near(heard[j].w, scriptWords[k])) { last = j; k++; gap = 0; }
      else if (j + 1 < heard.length && heard[j].w + heard[j + 1].w === scriptWords[k]) { last = j + 1; k++; gap = 0; j++; }
      else gap++;
      j++;
    }
    return { start: s, end: last, got: k / scriptWords.length };
  };
  let best = null;
  for (const pass of [0, 1]) {                                   // pass 0: start on word 1; pass 1: word 2 (word 1 misheard)
    for (let s = 0; s < heard.length; s++) {
      const joined = s + 1 < heard.length && !!scriptWords[pass] && heard[s].w + heard[s + 1].w === scriptWords[pass];
      if (!scriptWords[pass] || (!near(heard[s].w, scriptWords[pass]) && !joined)) continue;
      const r = joined ? { ...walk(s + 1, pass + 1), start: s } : walk(s, pass + 1);
      if (!best || r.got > best.got + 1e-9) best = r;
      if (r.got >= 0.999) return best;                           // earliest complete reading wins
    }
    if (best && best.got >= 0.6) return best;
  }
  return best;
}

/* Voice activity from the audio itself: 50 ms RMS windows, speech = 12 dB over the 20th-percentile
   floor. Whisper's word timings collapse on repeated speech (a second reading gets squeezed into
   zero time at the end), so where a reading ends is found from the pauses, not from the timings. */
async function voiced(file) {
  const { stdout } = await run("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
    { encoding: "buffer", maxBuffer: 1 << 27 });
  const n = 800, rms = [];
  for (let i = 0; i + n <= stdout.length / 2; i += n) {
    let s = 0; for (let k = 0; k < n; k++) { const v = stdout.readInt16LE((i + k) * 2) / 32768; s += v * v; }
    rms.push(10 * Math.log10(s / n + 1e-12));
  }
  const sorted = [...rms].sort((x, y) => x - y), floor = sorted[Math.floor(sorted.length * 0.2)] ?? -90;
  const on = rms.map((d) => d > floor + 12);
  const spans = [];
  for (let i = 0; i < on.length; i++) if (on[i]) { const st = i; while (i < on.length && on[i]) i++; spans.push([st * 0.05, i * 0.05]); }
  const merged = [];                                             // bridge micro-gaps inside words
  for (const sp of spans) { const l = merged.at(-1); if (l && sp[0] - l[1] < 0.12) l[1] = sp[1]; else merged.push([...sp]); }
  return merged;
}
// The silence gap (between two voiced spans) whose start sits nearest `target` seconds.
function gapNear(spans, target, maxDist) {
  let best = null;
  for (let i = 0; i + 1 < spans.length; i++) {
    const g = { start: spans[i][1], end: spans[i + 1][0] };
    if (g.end - g.start < 0.15) continue;
    const d = Math.abs(g.start - target);
    if (d <= maxDist && (!best || d < best.d)) best = { ...g, d };
  }
  return best;
}

/* ── GATE 1 · lint ─────────────────────────────────────────────────────────── */
async function lint(files, { accent }) {
  const items = [];
  const stills = [];
  for (const f of files) {
    const cfg = JSON.parse(await readFile(f, "utf8"));
    for (const job of cfg.jobs ?? []) {
      const p = String(job.prompt ?? ""), where = `${basename(f)}:${job.name}`;
      const lines = spokenLines(p);
      const isStill = !job.seconds && !job.duration && !job.mode && !job.audio;
      if (isStill) stills.push({ where, p, refs: (job.image_urls ?? []).length, anchor: job.anchor === true });

      for (const [term, us] of Object.entries(DIALECT.hard))
        if (has(p, term)) items.push({ level: "FAIL", check: "DIALECT", where, msg: `"${term}" → "${us}" (draws a non-US scene; the clip then voices it)` });
      for (const [term, us] of Object.entries(DIALECT.soft))
        if (has(p, term)) items.push({ level: "WARN", check: "DIALECT", where, msg: `"${term}" → "${us}"` });
      if (!accent) for (const term of DIALECT.never_in_a_voice_line)
        if (has(p, term)) items.push({ level: "FAIL", check: "VOICE-FOREIGN", where, msg: `"${term}" names a non-American voice (mid-Atlantic = transatlantic, half-British)` });

      if (lines.length && !isStill) {
        if (!accent) {
          if (!/american/i.test(p)) items.push({ level: "FAIL", check: "ACCENT-MISSING", where, msg: "spoken clip with no American accent line" });
          else if (!DIALECT.us_regions.some((r) => has(p, r)))
            items.push({ level: "FAIL", check: "ACCENT-REGION", where, msg: 'name a US region ("Upper-Midwest", "Southern", "Texas"…); bare "General American" lost 3/3 on a non-US frame' });
        }
        if (lines.length > 1) items.push({ level: "FAIL", check: "LINE-COUNT", where, msg: `${lines.length} separate quoted lines in one clip — one line per clip, so cuts land on clip boundaries` });
        const before = p.slice(0, p.indexOf(`"${lines[0]}"`)).trimEnd();
        if (/\bthey\s+say\s*:?\s*$/i.test(before) || /[A-Z][A-Z ,'-]{5,}:\s*$/.test(before))
          items.push({ level: "FAIL", check: "PROMPT-LEAK", where, msg: `text right before the quote gets spoken ("${before.slice(-40)}") — use a bare quote or "He says:"` });
        const secs = Number(job.seconds ?? job.duration ?? 0);
        const n = words(lines[0]).length;
        if (lines.length === 1 && n <= 6 && secs >= 5)
          items.push({ level: "WARN", check: "SHORT-LINE", where, msg: `${n}-word line in a ${secs}s clip — the model repeats it to fill; trim to the first reading in assembly` });
      }
      // PROMPT-DUP: the same long passage twice in one prompt — usually an old description pasted in beside
      // a new one while templating, so the model gets two rooms or two people to reconcile.
      { const seen = new Set();
        for (const s of p.split(/(?<=[.!?])\s+/).map((x) => norm(x)).filter((x) => x.length >= 60)) {
          if (seen.has(s)) { items.push({ level: "FAIL", check: "PROMPT-DUP", where, msg: `repeats "${s.slice(0, 50)}…" — a description got pasted in twice` }); break; }
          seen.add(s);
        } }
      if (DIALECT.exterior_markers.some((m) => has(p, m)) && !DIALECT.us_locale_anchors.some((a) => has(p, a)))
        items.push({ level: "WARN", check: "LOCALE", where, msg: 'exterior shot with no American locale anchor ("an American suburban main street", "US license plates")' });
    }
  }
  // IDENTITY: the same PERSON in 2+ stills, and a later still with no reference image.
  // Compare distinctive trait fragments ("a small silver stud in the left nostril", "a faint
  // scar on the left cheekbone"), not whole sentences: shared realism boilerplate must not
  // make two different people look like one, and a stray "no logo" inside a description must
  // not hide the person. Two stills sharing 2+ trait fragments are the same person. A still
  // marked "anchor": true is a deliberate new anchor (or a re-roll replacing one) and is exempt.
  const BOILER = /hyper.?realistic|bokeh|pores|vellus|beauty filter|colou?r grade|subtitles|captions|watermark|9:16|candid mobile|deep focus|fictional|likeness|retouch|smoothing|no phone|eye.?level|eye moisture|fram(ed|ing)|close.?up|medium shot|wide shot|camera|lens|gaze|looking|daylight|lighting|\blit\b|reflection/i;
  const TRAIT = /\b(hair|hairline|skin tone|complexion|beard|stubble|moustache|mustache|eyebrows?|brows|scar|mole|freckles?|tattoo|bald|shaved head|close.?shaved|twists|dreadlocks|ponytail|bun|braids?|glasses|stud|piercing|nostril|cheekbone|jawline|chin|crow's feet|tooth|teeth|wrinkles|smile lines|dimple|birthmark|olive skin|weathered)\b/i;
  const frags = (p) => new Set(p.split(/[,.;]|\bwith\b|\band\b/i).map((f) => norm(f)).filter((f) => f.length >= 14 && TRAIT.test(f) && !BOILER.test(f)));
  const flagged = new Set();
  for (let i = 0; i < stills.length; i++) for (let j = i + 1; j < stills.length; j++) {
    const A = stills[i], B = stills[j];
    if (B.refs || B.anchor || flagged.has(B.where)) continue;
    const fa = frags(A.p), shared = [...frags(B.p)].filter((f) => fa.has(f));
    if (shared.length >= 2) {
      flagged.add(B.where);
      items.push({ level: "FAIL", check: "IDENTITY", where: B.where,
        msg: `same person as ${A.where.split(":").pop()} ("${shared[0]}", "${shared[1]}") but no image_urls — pass that still as a reference, or mark "anchor": true if it is a deliberate re-roll` });
    }
  }
  return report("lint", items, join(dirname(resolve(files[0])), "qa-lint.json"));
}

/* ── GATE 2 · clips ────────────────────────────────────────────────────────── */
async function pairsFrom(args, script, items = []) {
  let pairs = [];                          // { file, line }
  if (args[0]?.endsWith(".json")) {
    const cfg = JSON.parse(await readFile(args[0], "utf8"));
    const out = resolve(dirname(resolve(args[0])), cfg.outDir ?? ".");
    for (const j of cfg.jobs ?? []) {
      const file = (await exists(join(out, `${j.name}.mp4`))) ? join(out, `${j.name}.mp4`) : resolve(cfg.outDir ?? ".", `${j.name}.mp4`);
      pairs.push({ file, line: spokenLines(j.prompt ?? "")[0] ?? null, prompt: j.prompt ?? "" });
    }
  } else {
    const lines = script ? (await readFile(script, "utf8")).split("\n").map((l) => l.trim()) : [];
    pairs = args.map((file, i) => ({ file: resolve(file), line: (lines[i] && lines[i] !== "-") ? lines[i] : null }));
  }
  return (await Promise.all(pairs.map(async (p) => ((await exists(p.file)) ? p : (items.push({ level: "FAIL", check: "MISSING-FILE", where: basename(p.file), msg: "clip not on disk" }), null))))).filter(Boolean);
}

async function clips(args, { script, accent, trims }) {
  const items = [];
  const pairs = await pairsFrom(args, script, items);
  const win = trims ? JSON.parse(await readFile(trims, "utf8")) : {};

  const spoken = pairs.filter((p) => p.line);
  const whisper = whisperStatus();
  // With --trims, judge only the window the edit will use: cut it to a temp wav first.
  const tmp = await mkdtemp(join(tmpdir(), "qa-win-"));
  const audioOf = new Map();
  for (const p of spoken) {
    const w = win[basename(p.file)];
    if (!w) { audioOf.set(p.file, p.file); continue; }
    const wav = join(tmp, basename(p.file).replace(/\.mp4$/i, ".wav"));
    await run("ffmpeg", ["-v", "error", "-y", "-ss", String(w.in), "-t", String(w.seconds), "-i", p.file, "-vn", "-ac", "1", "-ar", "16000", wav]);
    audioOf.set(p.file, wav);
  }
  // Accent needs speech to judge. Under MIN_SPEECH seconds of voice the classifier is noise
  // (measured 2026-09-12: a 1 s "You refinished." scored British at -0.02 while the same speaker's
  // twelve lines pooled scored American at +0.58). So a short clip gets no verdict of its own; it is
  // judged inside a pool of every clip with the same voice line. Clips with enough speech are judged
  // alone as well, so one drifted take cannot hide in an otherwise American pool.
  const MIN_SPEECH = 2.5;
  const voiceOf = (p) => (String(p.prompt ?? "").match(/\bspeak(?:s|ing) in ([^.;]+)/i)?.[1] ?? "").trim().toLowerCase() || null;
  const speechSecs = new Map();
  for (const p of spoken) { const v = await voiced(audioOf.get(p.file)); speechSecs.set(p.file, v.reduce((s, x) => s + (x[1] - x[0]), 0)); }
  const solo = spoken.filter((p) => speechSecs.get(p.file) >= MIN_SPEECH || !voiceOf(p));
  const acc = new Map();
  if (!accent) {
    const accRaw = await accentCheck(solo.map((p) => audioOf.get(p.file)));
    for (const p of solo) acc.set(p.file, accRaw.get(audioOf.get(p.file)));
    const pools = new Map();                                  // voice line → clips
    for (const p of spoken) { const v = voiceOf(p); if (v) { if (!pools.has(v)) pools.set(v, []); pools.get(v).push(p); } }
    for (const [voice, members] of pools) {
      const short = members.filter((p) => speechSecs.get(p.file) < MIN_SPEECH);
      if (!short.length) continue;
      const list = join(tmp, `pool-${pools.size}-${members.length}.txt`), wav = list.replace(/\.txt$/, ".wav");
      await writeFile(list, members.map((p) => `file '${audioOf.get(p.file).replace(/'/g, "'\\''")}'`).join("\n"));
      await run("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-ac", "1", "-ar", "16000", wav]);
      const r = (await accentCheck([wav])).get(wav);
      for (const p of short) acc.set(p.file, r && { ...r, pooled: members.length });
    }
  }
  for (const p of spoken) {
    const where = basename(p.file) + (win[basename(p.file)] ? " [trimmed]" : "");
    const a = acc.get(p.file);
    if (a?.verdict === "FAIL") items.push({ level: "FAIL", check: "ACCENT", where, msg: `not North American (margin ${a.margin}, closest ${a.closest_other[0]})${a.pooled ? ` — judged with this voice's ${a.pooled} clips pooled, too little speech alone` : ""} — regenerate with a named US region and an American-looking frame` });
    if (!whisper.ok) { items.push({ level: "WARN", check: "TRANSCRIPT", where, msg: whisper.reason }); continue; }
    const heard = await transcribe(audioOf.get(p.file), whisper);
    if (heard == null) { items.push({ level: "WARN", check: "TRANSCRIPT", where, msg: "no audio to transcribe" }); continue; }
    const want = words(p.line), got = words(heard);
    const letters = (s) => norm(s).replace(/[^a-z0-9]/g, "");
    const covered = letters(heard).includes(letters(p.line)) ? 1 : want.filter((w) => got.includes(w)).length / Math.max(1, want.length);
    if (covered < 0.85) items.push({ level: "FAIL", check: "MISSING", where, msg: `${Math.round(covered * 100)}% of the line heard: "${heard.slice(0, 80)}"` });
    else if (covered < 1 && want.length >= 3 && !(got.some((g) => near(g, want[0])) && got.some((g) => near(g, want.at(-1)))))
      items.push({ level: "FAIL", check: "MISSING", where, msg: `the line's ${got.some((g) => near(g, want[0])) ? "last" : "first"} word is gone: "${heard.slice(0, 80)}" — usually a cut that starts or ends one word too tight` });
    const line = norm(p.line), h = norm(heard);
    const first = h.indexOf(line.slice(0, Math.min(line.length, 24)));
    if (line.length >= 8 && first >= 0 && h.indexOf(line.slice(0, Math.min(line.length, 24)), first + 1) > first)
      items.push({ level: "FAIL", check: "REPEAT", where, msg: `line spoken twice: "${heard.slice(0, 80)}" — trim to the first reading or re-roll` });
    const firstWant = want[0], idx = got.indexOf(firstWant);
    if (idx >= 2) items.push({ level: "FAIL", check: "HEAD-LEAK", where, msg: `${idx} unscripted words before the line: "${got.slice(0, idx).join(" ")}"` });
  }
  await rm(tmp, { recursive: true, force: true });
  const outDir = args[0]?.endsWith(".json") ? dirname(resolve(args[0])) : dirname(resolve(pairs[0]?.file ?? "."));
  return report("clips", items, join(outDir, "qa-clips.json"));
}

/* ── trim ──────────────────────────────────────────────────────────────────── */
// Every heuristic that timed the cut from one signal failed on some clip (2026-09-12):
//   · first/last sound: kept a sniff 0.9 s before the line and a scoff 2 s after it
//   · whisper word timestamps: meaningless on short clips ("Laminate" stretched over 0.02–5.88 s)
//   · word-count share of the speech: wrong when a garbled lead-in is spoken fast
// The one signal that held everywhere is a transcript of the candidate window itself. So: split the
// clip into sound bursts, try every run of consecutive bursts as the cut, transcribe each run, and
// keep the tightest run that reads as the scripted line — complete, once, with nothing extra. A line
// spoken twice with no pause between the readings is then split at the finest pause inside the run.
async function pickWindow(file, line, whisper, dur) {
  const want = words(line);
  const spans = await voiced(file);
  if (!spans.length) return { reason: "no speech detected" };
  const bursts = spans.filter((sp) => sp[1] - sp[0] >= 0.08);
  const chunks = []; for (const sp of (bursts.length ? bursts : spans)) { const l = chunks.at(-1); if (l && sp[0] - l[1] < 0.12) l[1] = sp[1]; else chunks.push([...sp]); }
  const cands = [];
  const C = chunks.length > 10 ? [[chunks[0][0], chunks.at(-1)[1]]] : chunks;
  for (let i = 0; i < C.length; i++) for (let j = i; j < C.length; j++) cands.push([C[i][0], C[j][1]]);
  cands.sort((x, y) => (x[1] - x[0]) - (y[1] - y[0]));            // tightest first
  const score = (heard) => {
    const got = words(heard); const r = firstReading(want, got.map((w) => ({ w, start: 0, end: 0 })));
    const cov = got.length && (norm(heard).replace(/[^a-z0-9]/g, "").includes(norm(line).replace(/[^a-z0-9]/g, ""))) ? 1 : (r ? r.got : 0);
    const extra = Math.max(0, got.length - want.length);
    const l = norm(line), h = norm(heard), head = l.slice(0, Math.min(24, l.length));
    const twice = l.length >= 6 && h.indexOf(head) >= 0 && h.indexOf(head, h.indexOf(head) + 1) > 0;
    return { cov, extra, twice };
  };
  let best = null;
  for (const [a, b] of cands) {
    const win = { in: Math.max(0, a - 0.08), seconds: Math.min(dur, b + 0.15) - Math.max(0, a - 0.08) };
    const heard = await transcribe(file, whisper, win);
    if (heard == null) continue;
    const s = score(heard);
    // Rank: every word present beats a tighter window missing one (a dropped "Nope." is a lost beat),
    // then no repeat, then nothing extra, then the tightest.
    const gotW = words(heard), edges = gotW.some((g) => near(g, want[0])) && gotW.some((g) => near(g, want.at(-1)));
    const full = s.cov >= 0.97 && edges, ok = s.cov >= 0.85;
    const key = (full ? 0 : ok ? 1 : 2) * 1e6 + (s.twice ? 1e4 : 0) + s.extra * 100 + win.seconds;
    if (!best || key < best.key) best = { key, a, b, win, heard, ...s };
    if (full && !s.twice && s.extra === 0) break;                 // tightest complete reading: done
  }
  if (!best) return { reason: "could not transcribe any window" };
  // A repeat with no pause between readings sits inside one run: split it at the finest pause.
  if (best.twice) {
    const inner = spans.filter((sp) => sp[0] >= best.a - 0.01 && sp[1] <= best.b + 0.01);
    const gaps = []; for (let i = 0; i + 1 < inner.length; i++) if (inner[i + 1][0] - inner[i][1] >= 0.08) gaps.push(inner[i][1]);
    for (const g of gaps.sort((x, y) => Math.abs(x - (best.a + best.b) / 2) - Math.abs(y - (best.a + best.b) / 2))) {
      const win = { in: best.win.in, seconds: g + 0.15 - best.win.in };
      const heard = await transcribe(file, whisper, win), s = heard == null ? null : score(heard);
      if (s && s.cov >= 0.85 && !s.twice) { best = { ...best, b: g, win, heard, ...s }; break; }
    }
  }
  return best;
}

async function trim(args, { script }) {
  const pairs = await pairsFrom(args, script);
  const whisper = whisperStatus();
  if (!whisper.ok) throw new Error(whisper.reason);
  const out = {}, items = [];
  for (const p of pairs) {
    const name = basename(p.file);
    if (!p.line) continue;                                       // silent clip: no trim
    const dur = Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p.file])).stdout);
    const w = await pickWindow(p.file, p.line, whisper, dur);
    if (!w.win) { items.push({ level: "WARN", check: "TRIM", where: name, msg: `${w.reason} — left untrimmed` }); continue; }
    if (w.cov < 0.85) items.push({ level: "WARN", check: "TRIM", where: name, msg: `best window reads "${String(w.heard).slice(0, 50)}" (${Math.round(w.cov * 100)}%) — the clip may not contain the full line` });
    out[name] = { in: +w.win.in.toFixed(2), seconds: +w.win.seconds.toFixed(2), heard: w.heard, of: +dur.toFixed(2) };
  }
  const dir = args[0]?.endsWith(".json") ? dirname(resolve(args[0])) : dirname(resolve(pairs[0]?.file ?? "."));
  await writeFile(join(dir, "trims.json"), JSON.stringify(out, null, 2));
  console.log(`  trims → ${join(dir, "trims.json")}  (${Object.keys(out).length} clips)`);
  return report("trim", items, join(dir, "qa-trim.json"));
}

/* ── GATE 3 · final ────────────────────────────────────────────────────────── */
async function final(assemblePath, { sourceSeconds, maxSeconds, format, accent }) {
  const items = [];
  const a = JSON.parse(await readFile(assemblePath, "utf8"));
  const outDir = resolve(dirname(resolve(assemblePath)), a.outDir && !a.outDir.startsWith("/") ? "." : ".");
  const manifestPath = (await exists(join(dirname(resolve(assemblePath)), "manifest.json"))) ? join(dirname(resolve(assemblePath)), "manifest.json") : join(resolve(a.outDir ?? "."), "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const house = { style: "karaoke", maxWords: 3, maxChars: 16 };

  for (const [ji, job] of (a.jobs ?? []).entries()) {
    const m = manifest.find((x) => x.name === job.name) ?? manifest[ji];
    if (!m) { items.push({ level: "FAIL", check: "MANIFEST", where: job.name, msg: "no rendered manifest entry — render before QA" }); continue; }
    const W = job.name;
    // Formats that declare their own long runtime band in their module are held to that band;
    // everything else is held to the source ad (× 1.35) and never past 90 s.
    const BANDS = { "drama": [90, 200], "funnel-walkthrough": [60, 190] };
    const key = Object.keys(BANDS).find((k) => new RegExp(k, "i").test(format ?? job.name));
    const cap = key ? BANDS[key][1] : Math.min(maxSeconds ?? 90, sourceSeconds ? sourceSeconds * 1.35 : Infinity);
    const why = key ? `the ${key} module's declared ${BANDS[key].join("–")} s band` : sourceSeconds ? `source ${sourceSeconds} s × 1.35` : "the 90 s ceiling";
    if (m.seconds > cap) items.push({ level: "FAIL", check: "RUNTIME", where: W, msg: `${m.seconds.toFixed(1)} s against ${cap.toFixed(0)} s (${why})` });

    const segs = m.clips ?? [];
    const uses = new Map();
    for (const s of segs) uses.set(s.file, (uses.get(s.file) ?? 0) + 1);
    for (const [f, n] of uses) if (n >= 3 && /\.mp4$/i.test(f))
      items.push({ level: "FAIL", check: "SLICED-TAKE", where: `${W}:${f}`, msg: `one take cut into ${n} segments — generate one line per clip instead of slicing inside takes` });

    const seenLines = new Map();
    segs.forEach((s, i) => {
      const where = `${W}#${i + 1} ${s.file}`;
      const heard = s.heard ?? "";
      const spoken = words(heard).length > 0;
      const src = (job.clips ?? [])[i] ?? {};
      // A short line in its own clip is a clean cut, even trimmed to its speech with `in`.
      // A piece carved out of a take that also feeds other segments is not.
      const sliced = (uses.get(s.file) ?? 0) >= 2;
      if (spoken && s.seconds < 1.2 && sliced)
        items.push({ level: "FAIL", check: "MICRO-CUT", where, msg: `${s.seconds.toFixed(2)} s cut out of the middle of a take ("${heard.slice(0, 40)}")` });
      if (spoken && src.script) {
        const want = words(src.script), got = words(heard);
        const lettersOf = (s) => norm(s).replace(/[^a-z0-9]/g, "");
        const cov = lettersOf(heard).includes(lettersOf(src.script)) ? 1 : want.filter((w) => got.includes(w)).length / Math.max(1, want.length);
        if (cov < 0.8) items.push({ level: "FAIL", check: "MISMATCH", where, msg: `heard "${heard.slice(0, 44)}" for "${String(src.script).slice(0, 44)}" (${Math.round(cov * 100)}%) — clipped or wrong words` });
      }
      const n = norm(heard);
      if (n && words(n).length >= 2) {
        const half = n.slice(0, Math.floor(n.length / 2)).trim();
        if (half.length >= 8 && n.indexOf(half, half.length) >= 0) items.push({ level: "FAIL", check: "DUPLICATE", where, msg: `line repeats inside the segment: "${heard.slice(0, 60)}"` });
        if (seenLines.has(n)) items.push({ level: "FAIL", check: "DUPLICATE", where, msg: `same line as segment #${seenLines.get(n) + 1}: "${heard.slice(0, 60)}"` });
        else seenLines.set(n, i);
      }
      if (!spoken && s.seconds > 1.0 && i > 0 && i < segs.length - 1 && words(segs[i - 1].heard ?? "").length && words(segs[i + 1].heard ?? "").length)
        items.push({ level: "WARN", check: "DEAD-AIR", where, msg: `${s.seconds.toFixed(1)} s with no speech between two spoken segments` });
    });

    // How the cut scene SOUNDS (tools/audio_check.py): only when clips name their speaker.
    const withSpk = (job.clips ?? []).some((c) => c.speaker);
    if (withSpk) {
      const segs = segs0 => segs0.map((s, i) => ({ start: s.start, seconds: s.seconds, heard: s.heard ?? "", speaker: (job.clips ?? [])[i]?.speaker ?? null }));
      const tmpd = await mkdtemp(join(tmpdir(), "qa-aud-")), sf = join(tmpd, "segments.json");
      await writeFile(sf, JSON.stringify(segs(m.clips ?? [])));
      try {
        const { stdout } = await run(ACCENT_PY, [join(HERE, "audio_check.py"), "final", m.file, sf], { maxBuffer: 1 << 24, timeout: 20 * 60e3 });
        const o = JSON.parse(stdout.trim().split("\n").pop());
        for (const [spk, v] of Object.entries(o.voice ?? {}))
          if (v.median < 0.40) items.push({ level: "FAIL", check: "VOICE-DRIFT", where: `${W}:${spk}`, msg: `${spk} sounds like a different person from line to line (median similarity ${v.median} across ${v.lines} lines; one real person scores 0.42+) — run tools/voice_unify.py` });
        for (const x of o.voice_cross ?? []) {
          const self = Math.min(o.voice?.[x.a]?.median ?? 1, o.voice?.[x.b]?.median ?? 1);
          if (x.median >= 0.40 || x.median >= self - 0.05) items.push({ level: "FAIL", check: "VOICE-CONFUSION", where: `${W}:${x.a}+${x.b}`, msg: `${x.a} and ${x.b} sound like the same person (cross similarity ${x.median}; different characters measured 0.04–0.26) — give one of them a different voice reference` });
        }
        for (const spk of new Set((job.clips ?? []).map((c) => c.speaker).filter(Boolean)))
          if (!o.voice?.[spk]) items.push({ level: "WARN", check: "VOICE-DRIFT", where: `${W}:${spk}`, msg: `${spk} has fewer than 3 lines long enough to measure — voice consistency not checked` });
        const loud = (o.loudness_jumps ?? []).filter((x) => Math.abs(x.db) > 6);
        if (loud.length) items.push({ level: "FAIL", check: "LOUDNESS", where: W, msg: `${loud.length} cuts jump more than 6 dB in speech level (spread ${o.speech_spread_db} dB) — level every line (tools/voice_unify.py target_db)` });
        else if ((o.loudness_jumps ?? []).length) items.push({ level: "WARN", check: "LOUDNESS", where: W, msg: `${o.loudness_jumps.length} cuts jump 4–6 dB in speech level` });
        // Room tone is continuous by construction when every spoken line is a voice_unify.py output (dry,
        // silent between words) over one voice_unify.py bed; the floor then only follows the music's own
        // dynamics, which is not a cut artifact. Check it only when native clip audio reaches the mix.
        const spokenClips = (job.clips ?? []).filter((c) => c.speaker);
        let built = spokenClips.length > 0 && typeof (job.music ?? a.music) === "string" && (await exists((job.music ?? a.music) + ".json"));
        for (const c of spokenClips) if (built && !(c.audio && (await exists(join(dirname(resolve(c.audio)), "unify-manifest.json"))))) built = false;
        if (!built && (o.room_jumps ?? []).length) items.push({ level: "FAIL", check: "ROOM-TONE", where: W, msg: `the background changes by more than 6 dB at ${o.room_jumps.length} cuts (spread ${o.room_spread_db} dB) — lay one continuous room-tone bed` });
        if (o.turn_gap_median != null && o.turn_gap_median > 0.6) items.push({ level: "WARN", check: "PACING", where: W, msg: `median pause between speakers ${o.turn_gap_median} s — dialogue drags; trim tighter` });
        for (const g of (o.gaps ?? []).filter((x) => !x.same_speaker && x.seconds > 1.2))
          items.push({ level: "WARN", check: "PACING", where: `${W}#${g.from}→${g.to}`, msg: `${g.seconds} s of silence between speakers` });
      } catch (e) { items.push({ level: "WARN", check: "AUDIO", where: W, msg: `audio check did not run: ${String(e.message).slice(0, 120)}` }); }
      finally { await rm(tmpd, { recursive: true, force: true }); }
    } else if (/drama|dialog|podcast|interview|hot-seat|expert/i.test(format ?? job.name)) {
      items.push({ level: "WARN", check: "AUDIO", where: W, msg: "multi-speaker ad with no \"speaker\" on its clips — voice consistency, loudness and room tone were not checked" });
    }

    const disc = job.disclosure ?? a.disclosure;
    if (disc !== false && disc !== undefined) items.push({ level: "FAIL", check: "DISCLOSURE", where: W, msg: "disclosure must be false (hard rule 14)" });

    const music = job.music ?? a.music;
    // Every track in the house Soundtracks pool is cleared by the operator, as is any song.mjs
    // output. Only a bed pulled from somewhere else is checked.
    const poolPath = (x) => typeof x === "string" && /\/Video Assets Raw\/Soundtracks\//i.test(x);
    // A bed built by voice_unify.py (room tone + a track) is cleared when its track is.
    let inPool = poolPath(music);
    if (!inPool && typeof music === "string" && (await exists(music + ".json"))) {
      const side = JSON.parse(await readFile(music + ".json", "utf8"));
      if (side.built_by === "voice_unify.py" && (!side.music || poolPath(side.music) || /\/song\//.test(side.music))) inPool = true;
    }
    if (typeof music === "string" && music && !inPool) {
      const name = basename(music);
      if (DIALECT.pirate_music_patterns.some((re) => new RegExp(re, "i").test(name)))
        items.push({ level: "FAIL", check: "MUSIC", where: W, msg: `"${name}" looks downloaded from a music site — unlicensed in a paid ad; generate a bed with tools/song.mjs` });
      else if (!/\/song\//.test(music)) {
        const lic = join(dirname(music), "LICENSES.json");
        const ok = (await exists(lic)) && JSON.parse(await readFile(lic, "utf8"))[name];
        if (!ok) items.push({ level: "FAIL", check: "MUSIC", where: W, msg: `"${name}" is not a song.mjs output and not listed in ${lic}` });
      }
    }

    const cap2 = job.captions ?? a.captions;
    if (cap2 && typeof cap2 === "object" && !(job.captionsException ?? a.captionsException)) {
      const off = Object.entries(house).filter(([k, v]) => cap2[k] !== undefined && cap2[k] !== v).map(([k]) => `${k}=${cap2[k]}`);
      if (off.length) items.push({ level: "WARN", check: "CAPTIONS", where: W, msg: `off house spec (${off.join(", ")}) — add "captionsException": "<why>" if deliberate` });
    }

    // Picture cuts must land where the caption timeline puts them. Measured 2026-09-13: segment
    // durations that were not whole frames, with AAC in the intermediate segments, let the picture
    // slip ~7 ms per cut — 0.33 s late after 47 cuts, every subtitle changing before its shot.
    // Detected shot changes are matched to the manifest's segment starts (±0.6 s).
    try {
      const { stderr } = await run("ffmpeg", ["-v", "info", "-i", m.file, "-vf", "scale=160:-1,select='gt(scene,0.2)',showinfo", "-an", "-f", "null", "-"], { maxBuffer: 1 << 26, timeout: 10 * 60e3 });
      const cuts = [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((x) => +x[1]);
      const starts = (m.clips ?? []).map((c) => c.start).slice(1);
      const d = starts.map((s) => { const n = cuts.reduce((b, c) => (Math.abs(c - s) < Math.abs(b - s) ? c : b), Infinity); return Math.abs(n - s) <= 0.6 ? n - s : null; }).filter((x) => x != null);
      const tail = d.slice(Math.floor(d.length * 0.75)).sort((x, y) => x - y);
      const med = tail.length ? tail[Math.floor(tail.length / 2)] : 0;
      if (tail.length >= 3 && Math.abs(med) > 0.08)
        items.push({ level: "FAIL", check: "CUT-DRIFT", where: W, msg: `picture cuts land ${med.toFixed(2)} s off the caption timeline by the end — segments are not frame-exact (re-render with the current tools/assemble.mjs)` });
    } catch {}

    // Captions over a graphic's own text. A full-frame still cutaway (an approval screen, a notes
    // card) under a spoken line gets the subtitle burned on top of its layout — on 2026-09-13 "still
    // a spot in your" landed across the card's "Cost to check" row. The band the caption occupies
    // is measured on the still: a flat background (10–90th percentile within 45 levels) with 1–40%
    // dark pixels is text or rules, not a photo. `"captionY"` on the cutaway moves the captions.
    if (cap2 !== false) {
      const capY = (cy) => Number(cy ?? (cap2 && typeof cap2 === "object" ? cap2.y : undefined) ?? 0.8);
      for (const [ci, c] of (job.clips ?? []).entries()) {
        if (!(c.script || c.audio || c.speaker)) continue;
        for (const cw of c.cutaways ?? []) {
          if (!/\.(png|jpe?g|webp)$/i.test(cw.file ?? "") || (cw.region && cw.region !== "full")) continue;
          const y = capY(cw.captionY), f = resolve(dirname(resolve(assemblePath)), cw.file);
          if (!(await exists(f))) continue;
          const band = `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,crop=720:ih*0.07:0:ih*${Math.max(0, y - 0.06).toFixed(3)},format=gray`;
          const stat = async (vf) => (await run("ffmpeg", ["-v", "error", "-i", f, "-vf", `${vf},signalstats,metadata=print:file=-`, "-f", "null", "-"], { maxBuffer: 1 << 20 })).stdout;
          try {
            const s = await stat(band), d = await stat(`${band},lut=y='if(lt(val,128),255,0)'`);
            const g = (txt, k) => Number((txt.match(new RegExp(`${k}=([0-9.]+)`)) ?? [])[1]);
            const spread = g(s, "YHIGH") - g(s, "YLOW"), dark = g(d, "YAVG") / 255;
            if (spread <= 45 && dark >= 0.01 && dark <= 0.4)
              items.push({ level: "FAIL", check: "CAPTION-COLLISION", where: `${W}#${ci + 1}`, msg: `the caption at y ${y} sits on ${basename(f)}'s own text (${(dark * 100).toFixed(1)}% dark pixels on a flat band) — set "captionY" on that cutaway to a clear band` });
          } catch {}
        }
      }
    }

    // Accent safety net: any spoken source clip whose folder has no passing qa-clips.json.
    if (!accent) {
      // assemble.mjs resolves clip paths against the working directory; fall back to the jobs file's folder.
      const base = dirname(resolve(assemblePath));
      const locate = async (f) => ((await exists(resolve(f))) ? resolve(f) : resolve(base, f));
      const srcs = [...new Set(await Promise.all((job.clips ?? []).filter((c) => c.file && /\.mp4$/i.test(c.file)).map((c) => locate(c.file))))];
      const unchecked = [];
      for (const f of srcs) {
        // gate 2 writes qa-clips.json beside the jobs file, which is usually the clip folder's parent
        let passed = false;
        for (const q of [join(dirname(f), "qa-clips.json"), join(dirname(dirname(f)), "qa-clips.json")])
          if (await exists(q)) { const r = JSON.parse(await readFile(q, "utf8")); passed = r.verdict === "PASS"; break; }
        const spokenHere = segs.some((s) => s.file === basename(f) && words(s.heard ?? "").length);
        if (!passed && spokenHere) { if (await exists(f)) unchecked.push(f); else items.push({ level: "WARN", check: "ACCENT", where: `${W}:${basename(f)}`, msg: "source clip not found, accent not checked — run qa from the folder assemble.mjs ran in" }); }
      }
      const acc = await accentCheck(unchecked);
      for (const [f, r] of acc) if (r.verdict === "FAIL")
        items.push({ level: "FAIL", check: "ACCENT", where: `${W}:${basename(f)}`, msg: `not North American (margin ${r.margin}, closest ${r.closest_other[0]})` });
    }
  }
  return report("final", items, join(dirname(resolve(assemblePath)), "qa-final.json"));
}

/* ── cli ───────────────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const opts = { accent: flag("--accent"), script: flag("--script"), trims: flag("--trims"), sourceSeconds: Number(flag("--source-seconds")) || undefined,
               maxSeconds: Number(flag("--max-seconds")) || undefined, format: flag("--format") };
const [gate, ...rest] = argv;
try {
  let out;
  if (gate === "lint" && rest.length) out = await lint(rest, opts);
  else if (gate === "clips" && rest.length) out = await clips(rest, opts);
  else if (gate === "trim" && rest.length) { out = await trim(rest, opts); out.verdict = "PASS"; }
  else if (gate === "final" && rest.length) out = await final(rest[0], opts);
  else { console.log("usage: qa.mjs lint <jobs.json…> | trim <jobs.json|clip.mp4…> | clips <jobs.json|clip.mp4…> [--script lines.txt] [--trims trims.json] | final <assemble.json> [--source-seconds N]"); process.exit(2); }
  process.exit(out.verdict === "PASS" ? 0 : 1);
} catch (e) { console.error(`qa: ${e.message}`); process.exit(2); }
