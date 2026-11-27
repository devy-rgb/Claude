#!/usr/bin/env node
/**
 * card.mjs — flat on-screen graphics as transparent PNGs, typeset in a browser.
 *
 * Video models garble printed text, so anything that has to read pixel-perfect —
 * a "Reply to @user's comment" bubble, an iOS-Notes title card, a big headline
 * block, a legal disclaimer box — is rendered here as HTML/CSS and laid over the
 * ad by tools/assemble.mjs (`overlays`). No npm install: it drives the Google
 * Chrome (or Chromium) already on the machine in headless mode.
 *
 *   node card.mjs cards.json
 *
 * ── CARDS FILE ───────────────────────────────────────────────────────────────
 *
 * {
 *   "outDir": "./ad-remix-runs/<slug>/05-assets/cards",
 *   "scale":  1,                                    // 2 for crisp 1080p finals
 *   "cards": [
 *     { "name": "reply",   "kind": "comment", "username": "maddie.k", "text": "is it too late to qualify?", "width": 640 },
 *     { "name": "title",   "kind": "notes",   "title": "3 things nobody told me", "lines": ["one", "two", "three"], "width": 720 },
 *     { "name": "hook",    "kind": "headline","text": "Didn't go to the ER\nbut still got paid", "width": 1000, "size": 52 },   // nowrap: break lines by hand
 *     { "name": "legal",   "kind": "disclaimer", "text": "...", "width": 900 },   // only when the user asks for a legal line; house rule is no disclaimer
 *     { "name": "custom",  "kind": "html",    "html": "<div style=\"...\">anything</div>", "width": 800 }
 *   ]
 * }
 *
 * Each card is screenshotted on a transparent page and trimmed to its tight
 * bounding box with ffmpeg, so the PNG is exactly the card — ready for
 * assemble.json `overlays: [{ "file": "reply.png", "x": 40, "y": 120, "w": 640 }]`.
 * The result's width/height are written to <outDir>/cards.json.
 *
 * Chrome is found at CHROME_PATH, then the usual macOS / Linux / Windows spots.
 * Without a browser the tool says so and exits 2 — nothing else here depends on
 * it (the same graphics can be approximated with assemble.json `text` blocks).
 */

import { mkdir, readFile, writeFile, rm, mkdtemp, access, stat, rename, copyFile } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

const expand = (p) => (typeof p === "string" && p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const abs = (p) => (p ? resolve(expand(p)) : p);
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const escHtml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl2br = (s) => escHtml(s).replace(/\r?\n/g, "<br>");

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const c of candidates) if (await exists(c)) return c;
  return null;
}

function run(cmd, args) {
  return new Promise((res) =>
    execFile(cmd, args, { timeout: 60_000, maxBuffer: 32 << 20 }, (err, stdout, stderr) =>
      res({ ok: !err, stdout: String(stdout ?? ""), stderr: String(stderr ?? "") })));
}

/* ── the presets ────────────────────────────────────────────────────────────── */

const SANS = `-apple-system, 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif`;
const HEAVY = `'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif`;   // Arial Black is opt-in via `font`: it is ~30% wider

function comment(c) {
  // The "Reply to @user's comment" sticker a creator answers on screen. Fictional
  // handle, the objection the hook answers, a blank avatar — never a real account.
  const dark = c.theme === "dark";
  const bg = dark ? "#1f1f1f" : "#ffffff", fg = dark ? "#ffffff" : "#161823", muted = dark ? "#bdbdbd" : "#6f7278";
  const size = num(c.size, 34);
  return `
<div id="card" style="width:${c.width}px;font-family:${SANS};color:${fg};">
  <div style="background:${bg};border-radius:${Math.round(size * 0.6)}px;padding:${Math.round(size * 0.55)}px ${Math.round(size * 0.7)}px ${Math.round(size * 0.6)}px;position:relative;box-shadow:0 6px 24px rgba(0,0,0,.18);">
    <div style="font-size:${Math.round(size * 0.62)}px;color:${muted};margin:0 0 ${Math.round(size * 0.3)}px ${Math.round(size * 1.75)}px;line-height:1.2;">Reply to ${escHtml(c.username ?? "user")}'s comment</div>
    <div style="display:flex;align-items:flex-start;gap:${Math.round(size * 0.45)}px;">
      <div style="flex:0 0 auto;width:${Math.round(size * 1.3)}px;height:${Math.round(size * 1.3)}px;border-radius:50%;background:${dark ? "#3a3a3a" : "#e4e6ea"};display:flex;align-items:flex-end;justify-content:center;overflow:hidden;">
        <svg width="${Math.round(size * 1.0)}" height="${Math.round(size * 1.0)}" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4.6" fill="${dark ? "#8a8a8a" : "#9aa0a8"}"/><path d="M2.5 24c.8-5.2 4.8-8.2 9.5-8.2s8.7 3 9.5 8.2z" fill="${dark ? "#8a8a8a" : "#9aa0a8"}"/></svg>
      </div>
      <div style="font-size:${size}px;font-weight:700;line-height:1.22;letter-spacing:-.01em;">${nl2br(c.text ?? "")}</div>
    </div>
    <div style="position:absolute;left:${Math.round(size * 1.5)}px;bottom:-${Math.round(size * 0.5)}px;width:${Math.round(size * 0.9)}px;height:${Math.round(size * 0.9)}px;background:${bg};transform:rotate(45deg);border-radius:${Math.round(size * 0.15)}px;"></div>
  </div>
</div>`;
}

function notes(c) {
  // iOS Notes look: plain white, black text, numbered or dashed list, no bezel.
  const size = num(c.size, 34);
  const lines = (c.lines ?? []).map((l, i) => `<div style="display:flex;gap:.55em;margin:0 0 .35em;"><span style="flex:0 0 auto;min-width:1.2em;color:#000;">${c.numbered === false ? "–" : `${i + 1}.`}</span><span>${nl2br(l)}</span></div>`).join("");
  return `
<div id="card" style="width:${c.width}px;background:#ffffff;color:#000;font-family:${SANS};font-size:${size}px;line-height:1.3;padding:${Math.round(size * 0.8)}px ${Math.round(size * 0.9)}px;border-radius:${num(c.radius, 0)}px;box-sizing:border-box;">
  ${c.date ? `<div style="text-align:center;color:#8a8a8e;font-size:.6em;margin-bottom:.6em;">${escHtml(c.date)}</div>` : ""}
  ${c.title ? `<div style="font-weight:700;font-size:1.25em;margin-bottom:.5em;letter-spacing:-.01em;">${nl2br(c.title)}</div>` : ""}
  ${lines}
  ${c.body ? `<div>${nl2br(c.body)}</div>` : ""}
</div>`;
}

function headline(c) {
  // Big social text: heavy sans, white fill, thick dark outline + drop shadow — or
  // on a solid box. The outline is a shadow stack, not -webkit-text-stroke, which
  // eats the fill at this weight. `\n` breaks are honoured; `nowrap` (default on)
  // keeps every line on one line so an overflow is visible instead of re-wrapped.
  const size = num(c.size, 56);
  const color = c.color ?? "#ffffff", stroke = c.stroke ?? "#000000";
  const o = Math.max(1, Math.round(size * num(c.outline, 0.07)));
  const ring = [[-o, -o], [o, -o], [-o, o], [o, o], [0, -o], [0, o], [-o, 0], [o, 0], [-o, 0], [0, 0]]
    .map(([x, y]) => `${x}px ${y}px 0 ${stroke}`).join(",");
  const shadow = `${ring}, 0 ${Math.round(size * 0.07)}px ${Math.round(size * 0.14)}px rgba(0,0,0,.55)`;
  const box = c.box ? `background:${c.box};padding:.25em .45em;border-radius:.2em;display:inline-block;` : "";
  const outline = c.box ? "" : `text-shadow:${shadow};-webkit-text-stroke:${Math.max(0.5, o * 0.3)}px ${stroke};`;
  const family = `${c.font ? "'" + escHtml(c.font).replace(/'/g, "") + "'," : ""}${HEAVY}`;
  return `
<div id="card" style="width:${c.width}px;text-align:${c.align ?? "center"};font-family:${family};font-weight:${num(c.weight, 800)};font-size:${size}px;line-height:${num(c.lineHeight, 1.14)};color:${color};letter-spacing:-.01em;padding:${Math.round(size * 0.2)}px;box-sizing:border-box;${c.nowrap === false ? "" : "white-space:nowrap;"}">
  <span style="${box}${outline}${c.uppercase ? "text-transform:uppercase;" : ""}">${nl2br(c.text ?? "")}</span>
</div>`;
}

function disclaimer(c) {
  // The grey legal box near the bottom safe zone.
  const size = num(c.size, 22);
  return `
<div id="card" style="width:${c.width}px;box-sizing:border-box;background:${c.box ?? "rgba(90,90,90,.78)"};color:${c.color ?? "#ffffff"};font-family:${SANS};font-weight:600;font-size:${size}px;line-height:1.3;text-align:center;padding:${Math.round(size * 0.6)}px ${Math.round(size * 0.9)}px;border-radius:${Math.round(size * 0.35)}px;">${nl2br(c.text ?? "")}</div>`;
}

const KINDS = { comment, notes, headline, disclaimer, html: (c) => `<div id="card" style="width:${c.width}px;">${c.html ?? ""}</div>` };

/* ── render: screenshot tall, then trim the transparent margin with ffmpeg ─── */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

// Headless Chrome on macOS sometimes writes the screenshot and then never
// exits (a fresh --user-data-dir makes it certain). So: spawn it, wait for the
// file to appear and stop growing, then kill the whole process group.
function screenshot(chrome, args, out, timeoutMs = 45_000) {
  return new Promise(async (res) => {
    const p = spawn(chrome, args, { stdio: "ignore", detached: true });
    let done = false;
    const finish = (ok, why) => {
      if (done) return; done = true;
      try { process.kill(-p.pid, "SIGKILL"); } catch {}
      try { p.kill("SIGKILL"); } catch {}
      // Chrome's helper processes outlive the group on macOS/Linux: sweep by the
      // unique page path this launch was given.
      if (process.platform !== "win32") execFile("pkill", ["-9", "-f", args[args.length - 1]], () => res({ ok, why }));
      else res({ ok, why });
    };
    p.on("error", (e) => finish(false, e.message));
    const t0 = Date.now();
    let last = -1, stable = 0;
    while (!done && Date.now() - t0 < timeoutMs) {
      await new Promise((r) => setTimeout(r, 150));
      let size = -1;
      try { size = (await stat(out)).size; } catch {}
      if (size > 0 && size === last) { if (++stable >= 3) return finish(true, "file stable"); }
      else stable = 0;
      last = size;
    }
    finish(false, "timed out waiting for the screenshot");
  });
}

async function trimAlpha(png, W, Hmax) {
  // Bounding box of the opaque pixels, read straight off the alpha plane —
  // ffmpeg's cropdetect under-reports boxes on sparse text, so we scan it here.
  const dump = await new Promise((res) => {
    const p = spawn(FFMPEG, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", png, "-vf", "alphaextract", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
      { stdio: ["ignore", "pipe", "ignore"] });
    const bufs = []; p.stdout.on("data", (d) => bufs.push(d));
    p.on("close", () => res(Buffer.concat(bufs))); p.on("error", () => res(Buffer.alloc(0)));
  });
  if (dump.length < W * Hmax) return { w: W, h: Hmax };
  let x0 = W, y0 = Hmax, x1 = -1, y1 = -1;
  for (let y = 0; y < Hmax; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) if (dump[row + x] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
  }
  if (x1 < 0) return { w: W, h: Hmax };
  const pad = 2;
  const x = Math.max(0, x0 - pad), y = Math.max(0, y0 - pad);
  const w = Math.min(W - x, x1 - x0 + 1 + pad * 2), h = Math.min(Hmax - y, y1 - y0 + 1 + pad * 2);
  const tmp = png + ".trim.png";
  const r = await run(FFMPEG, ["-hide_banner", "-y", "-i", png, "-vf", `crop=${w}:${h}:${x}:${y}`, "-pix_fmt", "rgba", tmp]);
  if (!r.ok) return { w: W, h: Hmax };
  await rename(tmp, png);
  return { w, h };
}

async function renderCard(chrome, card, outDir, scale, profile) {
  const kind = KINDS[card.kind];
  if (!kind) throw new Error(`unknown card kind "${card.kind}" (comment | notes | headline | disclaimer | html)`);
  const width = Math.round(num(card.width, 720));
  const maxH = Math.round(num(card.maxHeight, 1600));
  const inner = kind({ ...card, width });
  const html = join(profile, `${card.name}.html`);
  const out = join(outDir, `${card.name}.png`);
  await rm(out, { force: true });
  // The viewport is wider than the card and the card sits in its middle, so a
  // `nowrap` headline that overruns its width (CSS centres the overflow, spilling
  // both ways) is captured whole and reported, not clipped.
  const viewW = width + 600;
  await writeFile(html, `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent;} body{width:${viewW}px;} #card{box-sizing:border-box;margin:0 auto;}
  </style></head><body>${inner}</body></html>`, "utf8");

  const base = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-sync", "--mute-audio", "--use-mock-keychain",
    "--default-background-color=00000000", `--force-device-scale-factor=${scale}`,
    `--window-size=${viewW},${maxH}`, `--screenshot=${out}`, `file://${html}`];
  // Fast path: the machine's default profile (Chrome exits cleanly). Fallback: a
  // throwaway profile, which renders but hangs — the poll-and-kill handles that.
  let r = await screenshot(chrome, base, out, 25_000);
  if (!r.ok) r = await screenshot(chrome, [`--user-data-dir=${join(profile, `ud-${card.name}`)}`, ...base], out, 45_000);
  if (!r.ok) throw new Error(`screenshot failed for ${card.name}: ${r.why}`);

  if (process.env.CARD_KEEP_RAW) await copyFile(out, out.replace(/\.png$/, ".raw.png"));   // debugging: the untrimmed page
  const { w, h } = await trimAlpha(out, viewW * scale, maxH * scale);
  const info = { name: card.name, file: out, width: w, height: h, kind: card.kind };
  // (a comment card's soft shadow adds ~24px, hence the slack)
  if (w > width * scale + 32) { info.overflow = true; console.warn(`   ${card.name}: text is wider than width ${width} (${Math.round(w / scale)}px) — shorten a line or lower size`); }
  return info;
}

async function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) { console.error("usage: node card.mjs <cards.json>"); process.exit(1); }
  const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
  const chrome = await findChrome();
  if (!chrome) {
    console.error("card.mjs: no Chrome/Chromium found. Install Google Chrome or set CHROME_PATH. Cards were not rendered.");
    process.exit(2);
  }
  const outDir = abs(cfg.outDir) || resolve("./cards");
  await mkdir(outDir, { recursive: true });
  const scale = Math.max(1, Math.min(3, num(cfg.scale, 1)));
  const profile = await mkdtemp(join(tmpdir(), "card-"));
  const results = [];
  try {
    for (const card of cfg.cards ?? []) {
      if (!card.name) { results.push({ ok: false, error: "card needs a name" }); continue; }
      try {
        const r = await renderCard(chrome, card, outDir, scale, profile);
        console.log(`✓ ${card.name}.png  ${r.width}x${r.height}  (${card.kind})`);
        results.push({ ...r, ok: true });
      } catch (e) {
        console.error(`✗ ${card.name}: ${e.message}`);
        results.push({ name: card.name, ok: false, error: e.message });
      }
    }
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
  await writeFile(join(outDir, "cards.json"), JSON.stringify(results, null, 2));
  if (!results.some((r) => r.ok)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
