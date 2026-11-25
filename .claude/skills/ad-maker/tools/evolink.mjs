#!/usr/bin/env node
// Minimal Evolink client: submit → poll → download. Reports the settled cost.
//   node evolink.mjs jobs.json [--plan]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const BASE = process.env.EVOLINK_BASE_URL || "https://api.evolink.ai/v1";
function key() {
  if (process.env.EVOLINK_API_KEY) return process.env.EVOLINK_API_KEY;
  for (const p of ["./.env", join(homedir(), "Documents/Adsora/.env")]) {
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(/^EVOLINK_API_KEY\s*=\s*"?([^"\n\r]+)"?/m);
    if (m) return m[1].trim();
  }
  throw new Error("EVOLINK_API_KEY not found");
}
const K = key();
const H = { Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(kind, body) {
  const r = await fetch(`${BASE}/${kind}/generations`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(JSON.stringify(j.error ?? j).slice(0, 400));
  return j;
}
async function poll(id, { timeoutMs = 900000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await fetch(`${BASE}/tasks/${id}`, { headers: H });
    const j = await r.json();
    const s = (j.status || "").toLowerCase();
    if (["completed", "succeeded", "success"].includes(s)) return j;
    if (["failed", "error", "cancelled"].includes(s)) throw new Error(`task ${id} ${s}: ${JSON.stringify(j.error ?? j.fail_reason ?? "").slice(0,300)}`);
    await sleep(6000);
  }
  throw new Error(`task ${id} timed out`);
}
const urlsOf = (j) => (j.results ?? (j.result_data ?? []).map((d) => d.url ?? d)).filter(Boolean);

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  const plan = flags.includes("--plan");
  const cfg = JSON.parse(await readFile(file, "utf8"));
  const outDir = resolve(dirname(file), cfg.outDir ?? ".");
  await mkdir(outDir, { recursive: true });
  const results = [];
  let total = 0;

  const running = [];
  const conc = cfg.concurrency ?? 3;
  const queue = [...cfg.jobs];

  async function runOne(job) {
    const kind = job.kind ?? (job.seconds || job.duration ? "videos" : "images");
    const body = { model: job.model ?? cfg.model, prompt: job.prompt, ...(job.body ?? {}) };
    if (kind === "images") { body.size = job.size ?? cfg.size ?? "1024x1536"; body.n = 1; }
    else { body.aspect_ratio = job.aspect ?? cfg.aspect ?? "9:16"; body.duration = job.seconds ?? 5;
           if (job.quality ?? cfg.quality) body.quality = job.quality ?? cfg.quality;
           if (job.generate_audio !== undefined) body.generate_audio = job.generate_audio; }
    if (job.image_urls) body.image_urls = job.image_urls;
    if (plan) { console.log(`plan ${job.name} [${kind}] ${body.model}`); return; }
    const t = await submit(kind, body);
    process.stdout.write(`→ ${job.name} submitted ${t.id}\n`);
    const done = await poll(t.id);
    const urls = urlsOf(done);
    if (!urls.length) throw new Error(`${job.name}: no result url`);
    const ext = kind === "images" ? "png" : "mp4";
    const dest = join(outDir, `${job.name}.${ext}`);
    const buf = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
    await writeFile(dest, buf);
    const usd = done.usage?.cost?.usd ?? null;
    if (usd) total += usd;
    console.log(`✓ ${job.name}  ${(buf.length/1024).toFixed(0)}KB  ${usd != null ? "$"+usd.toFixed(3) : "cost n/a"}  ${dest}`);
    results.push({ name: job.name, file: dest, usd, url: urls[0] });
  }

  async function worker() { while (queue.length) { const j = queue.shift(); try { await runOne(j); } catch (e) { console.error(`✗ ${j.name}: ${e.message}`); results.push({ name: j.name, error: e.message }); } } }
  for (let i = 0; i < Math.min(conc, cfg.jobs.length); i++) running.push(worker());
  await Promise.all(running);

  if (!plan) {
    await writeFile(join(outDir, "evolink-results.json"), JSON.stringify({ total_usd: +total.toFixed(3), results }, null, 2));
    console.log(`\nTOTAL $${total.toFixed(3)}  →  ${join(outDir, "evolink-results.json")}`);
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
