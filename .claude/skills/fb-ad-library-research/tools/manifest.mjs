#!/usr/bin/env node
/* Build creatives-manifest.json — ONE record per distinct creative (by hash),
 * the input that media.sh (download), scripts.mjs (transcripts) and score.mjs
 * (RVERT) all read. The roofing baseline's manifest was built inline during
 * the run; this makes it a real pipeline step so the shape can't drift.
 *
 * Only on-niche ads with real copy and downloadable media qualify. Each family
 * of geo/price-swapped clones collapses into its best representative: highest
 * collation, then longest life.
 *
 * Usage: node manifest.mjs --niche roofing --date 2026-09-11 [--root <path>]
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn, copyFn, chash, slug } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

// same load as analyze.mjs: every raw/*.json, deduped by ad id
const ads = new Map();
for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
  for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
const A = rd(path.join(RUN, 'analysis.json'), null);
if (!A) { console.error('run analyze.mjs first'); process.exit(1); }
const bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
const tags = Object.fromEntries((rd(path.join(RUN, 'angles.json'), { rows: [] }).rows || []).map(r => [r.id, r]));
const CFG = loadNiche(NICHE);
const isRelevant = relevanceFn(CFG);
const isCopy = copyFn(CFG);

// page folder slug, with the same collision suffix analyze.mjs uses
const bySlug = new Map();
for (const a of ads.values()) { const s = slug(a.page); if (!bySlug.has(s)) bySlug.set(s, new Set()); bySlug.get(s).add(a.pid); }
const pageDir = a => slug(a.page) + (bySlug.get(slug(a.page)).size > 1 ? '-' + a.pid : '');

const fam = new Map();
for (const a of ads.values()) {
  if (!isRelevant(a) || !isCopy(a) || (!a.vid && !a.img)) continue;
  const hash = chash(a);
  const life = Math.max(0, ((a.act ? NOW : (a.end || NOW)) - (a.start || NOW)) / 86400);
  const f = fam.get(hash) || { hash, ads: 0, coll: 0, pages: new Set(), best: null, bestLife: 0, maxLife: 0 };
  f.ads++; f.coll += (a.coll || 1); f.pages.add(a.pid);
  f.maxLife = Math.max(f.maxLife, life);   // added 2026-09-13: how long the creative itself has run (oldest clone)
  if (!f.best || (a.coll || 1) > (f.best.coll || 1) || ((a.coll || 1) === (f.best.coll || 1) && life > f.bestLife)) { f.best = a; f.bestLife = life; }
  fam.set(hash, f);
}
const manifest = [...fam.values()].map(f => {
  const a = f.best, t = tags[a.id] || {}, kind = a.vid ? 'video' : 'image';
  const bucket = bucketOf[a.pid] || 'unclassified';
  return { hash: f.hash, id: a.id, pid: a.pid, page: a.page, bucket, kind,
    life: Math.round(f.bestLife), family_life: Math.round(f.maxLife), coll: a.coll || 1, family_ads: f.ads, family_coll: f.coll, pages: f.pages.size,
    fmt: a.fmt, cta: a.cta, angle: t.primary || 'unclassified', angles: t.angles || [], triggers: t.triggers || [],
    copy_hook: (a.body || '').split('\n').map(s => s.trim()).find(Boolean) || a.title || '',
    title: a.title || '', body: a.body || '', url: a.url || null,
    link: `https://www.facebook.com/ads/library/?id=${a.id}`,
    media: a.vid || a.img, thumb: a.thumb || null,
    file: `${bucket}/${pageDir(a)}/${a.id}-${f.hash}.${kind === 'video' ? 'mp4' : 'jpg'}` };
}).sort((x, y) => (y.family_coll * Math.min(y.life, 120)) - (x.family_coll * Math.min(x.life, 120)));
fs.writeFileSync(path.join(RUN, 'creatives-manifest.json'), JSON.stringify(manifest, null, 1));
console.log(JSON.stringify({ ok: true, creatives: manifest.length,
  video: manifest.filter(c => c.kind === 'video').length, image: manifest.filter(c => c.kind === 'image').length,
  by_bucket: manifest.reduce((m, c) => (m[c.bucket] = (m[c.bucket] || 0) + 1, m), {}) }, null, 2));
