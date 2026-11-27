#!/usr/bin/env node
/**
 * broll-pool.mjs — screen a b-roll folder by eye, then freeze the survivors.
 *
 * The renderers draw from whatever a folder holds, so a clip with baked-in
 * text, a watermark, a "SUBSCRIBE" overlay or a competitor's logo ends up under
 * the voice sooner or later. The pool is screened once, by eye, and the
 * survivors are written to broll-pool.json. faceless.mjs (`brollPool`) and
 * assemble.mjs (`brollPool`, or `broll.pool` per clip) then use only those.
 *
 *   node broll-pool.mjs <dir> [--out broll-pool.json] [--sheet sheet.jpg] [--min 1.4] [--per-sheet 48]
 *   node broll-pool.mjs <dir> --drop 3,9,14 [--out ...]     # rerun after looking at the sheet
 *   node broll-pool.mjs <dir> --keep 1,2,5,8 [--out ...]    # or name the survivors instead
 *
 * The first run probes every clip, sets aside anything shorter than --min,
 * writes a contact sheet of one mid-clip frame per clip with its number burned
 * in (48 clips per page, eight across, so each page stays readable; pages are
 * named sheet-1.jpg, sheet-2.jpg …), and writes the pool with every candidate.
 * Look at the sheet (Read the image), decide what goes, rerun with --drop (or
 * --keep). Numbers are the sheet's, and they are stable for a folder whose
 * contents have not changed.
 *
 * Pool shape (the same one the house talking-head project already uses):
 *   [ { "n": "003", "file": "clip.mp4", "dur": 9.17 }, ... ]
 * `file` is relative to the folder the pool was built from.
 */
import { readdir, mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

const expand = (p) => (p?.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const sh = (cmd, args) => new Promise((res, rej) =>
  execFile(cmd, args, { maxBuffer: 1 << 24 }, (e, out, err) => (e ? rej(new Error(err || e.message)) : res(out))));
const isVid = (f) => /\.(mp4|mov|m4v|webm)$/i.test(f) && !f.startsWith(".");

async function duration(file) {
  const out = await sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]);
  return +out.trim() || 0;
}
const arg = (flag, dflt) => { const i = process.argv.indexOf(flag); return i === -1 ? dflt : process.argv[i + 1]; };
const nums = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => parseInt(x, 10));

async function main() {
  const src = process.argv[2];
  if (!src || src.startsWith("--")) {
    console.error("usage: node broll-pool.mjs <dir> [--out broll-pool.json] [--sheet sheet.jpg] [--min 1.4] [--drop 3,9] [--keep 1,2]");
    process.exit(1);
  }
  const dir = resolve(expand(src));
  const out = resolve(expand(arg("--out", join(dir, "broll-pool.json"))));
  const sheet = resolve(expand(arg("--sheet", join(dir, "broll-contact-sheet.jpg"))));
  const min = +arg("--min", 1.4);
  const perSheet = Math.max(1, parseInt(arg("--per-sheet", 48), 10) || 48);
  const drop = new Set(nums(arg("--drop")));
  const keep = new Set(nums(arg("--keep")));

  const files = (await readdir(dir)).filter(isVid).sort();
  if (!files.length) throw new Error(`no video files in ${dir}`);
  const clips = [];
  for (const [i, f] of files.entries()) {
    const dur = await duration(join(dir, f)).catch(() => 0);
    clips.push({ n: String(i + 1).padStart(3, "0"), file: f, dur: +dur.toFixed(2), short: dur < min });
  }

  // Contact sheet: one frame from the middle of each usable clip, numbered, six per row.
  const work = join(tmpdir(), `broll-sheet-${Date.now()}`);
  await mkdir(work, { recursive: true });
  let k = 0;
  for (const c of clips) {
    if (c.short) continue;
    const dest = join(work, `${String(++k).padStart(3, "0")}.png`);
    const label = `${c.n}${drop.has(+c.n) ? " DROP" : ""}`;
    await sh("ffmpeg", ["-v", "error", "-ss", (c.dur / 2).toFixed(2), "-i", join(dir, c.file), "-frames:v", "1",
      "-vf", `scale=270:480:force_original_aspect_ratio=increase,crop=270:480,` +
             `drawtext=text='${label}':x=10:y=10:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8`,
      "-y", dest]);
  }
  const pages = [];
  for (let start = 1; start <= k; start += perSheet) {
    const n = Math.min(perSheet, k - start + 1);
    const cols = Math.min(8, n), rows = Math.ceil(n / cols);
    const page = k > perSheet ? sheet.replace(/(\.[a-z0-9]+)?$/i, `-${pages.length + 1}$1`) : sheet;
    await sh("ffmpeg", ["-v", "error", "-start_number", String(start), "-framerate", "1", "-i", join(work, "%03d.png"),
      "-frames:v", "1", "-vf", `tile=${cols}x${rows}:padding=4:color=black`, "-q:v", "3", "-y", page]);
    pages.push(page);
  }
  await rm(work, { recursive: true, force: true });

  const survivors = clips
    .filter((c) => !c.short && !drop.has(+c.n) && (!keep.size || keep.has(+c.n)))
    .map(({ n, file, dur }) => ({ n, file, dur }));
  await writeFile(out, JSON.stringify(survivors, null, 1) + "\n", "utf8");

  for (const c of clips) {
    const state = c.short ? "short" : drop.has(+c.n) ? "DROP " : keep.size && !keep.has(+c.n) ? "out  " : "keep ";
    console.log(`${c.n}  ${c.dur.toFixed(1).padStart(5)}s  ${state}  ${c.file}`);
  }
  console.log(`\n${survivors.length}/${clips.length} in the pool → ${out}`);
  if (k) console.log(`contact sheet → ${pages.join(", ")}` +
    (drop.size || keep.size ? "" : "\nlook at it, then rerun with --drop <numbers> (or --keep) to freeze the survivors"));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
