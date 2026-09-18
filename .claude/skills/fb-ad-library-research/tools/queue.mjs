#!/usr/bin/env node
/* Build the ranked download queue for a run.
   Usage: node queue.mjs --niche roofing --date 2026-09-11 [--root <path>] [--top 15]
   Writes <run>/download-queue.md and <run>/download-queue.json.
   Downloads NOTHING — the queue is a proposal for the user to approve. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const TOP = +(argv.top || 15);
const RUN = path.join(ROOT, NICHE, '_reports', DATE);

const raw = JSON.parse(fs.readFileSync(path.join(RUN, 'raw', 'ads-01.json'), 'utf8'));
const A = JSON.parse(fs.readFileSync(path.join(RUN, 'analysis.json'), 'utf8'));
let tags = {}; try {
  tags = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(RUN, 'angles.json'), 'utf8')).rows.map(r => [r.id, r]));
} catch {}
const bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
const byId = Object.fromEntries(raw.map(a => [a.id, a]));
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);   // run date, not the wall clock
const life = a => ((a.act ? NOW : a.end) - a.start) / 86400;

// Rank: proven (long-lived) x scaled (duplicated), creative must be downloadable.
const fam = new Map();
for (const a of raw) {
  if (!tags[a.id]) continue;                       // off-niche or DCO placeholder
  if (!a.vid && !a.img) continue;                  // nothing to download
  const key = tags[a.id].angles.join('|') + '::' + (a.body || '').slice(0, 60);
  const f = fam.get(key) || { total: 0, best: a };
  f.total += (a.coll || 1);
  if ((a.coll || 1) * Math.min(life(a), 120) > (f.best.coll || 1) * Math.min(life(f.best), 120)) f.best = a;
  fam.set(key, f);
}
const ranked = [...fam.values()]
  .map(f => ({ a: f.best, total: f.total, score: f.total * Math.min(life(f.best), 120) }))
  .sort((x, y) => y.score - x.score).slice(0, TOP);

const q = ranked.map((r, i) => {
  const a = r.a, t = tags[a.id] || {};
  return { n: i + 1, id: a.id, page: a.page, bucket: bucketOf[a.pid] || 'unclassified',
    life: Math.round(life(a)), coll: a.coll || 1, family_total: r.total, fmt: a.fmt,
    angle: t.primary || '-', triggers: (t.triggers || []).slice(0, 2),
    hook: (a.body || '').split('\n').find(Boolean) || a.title || '',
    link: `https://www.facebook.com/ads/library/?id=${a.id}`,
    landing: a.url || null, media: a.vid || a.img, kind: a.vid ? 'video' : 'image' };
});
fs.writeFileSync(path.join(RUN, 'download-queue.json'), JSON.stringify(q, null, 2));

const md = [`# Download queue — ${NICHE} · ${DATE}`, '',
  `${q.length} candidates, ranked by duplication x lifespan. **Nothing downloaded yet.**`,
  `Reply with the numbers you want (or "all affiliate", or "none").`, '',
  `> Ad Library media URLs are short-lived signed links and expire within hours.`,
  `> If a pull 403s, the ad gets re-harvested rather than reported as a dead link.`, ''];
for (const x of q) {
  md.push(`### ${x.n}. ${x.page} — ${x.kind}`, '',
    `> "${x.hook.replace(/\n/g, ' ').slice(0, 200)}"`, '',
    `- **Bracket**: ${x.bucket} · **Angle**: ${x.angle} · **Triggers**: ${x.triggers.join(', ') || '-'}`,
    `- **Alive**: ${x.life}d · **Collation**: x${x.coll} · **Family total**: x${x.family_total} · **Format**: ${x.fmt}`,
    `- **Ad Library**: ${x.link}`,
    `- **Landing**: ${x.landing || '(none — native lead form)'}`, '');
}
fs.writeFileSync(path.join(RUN, 'download-queue.md'), md.join('\n'));
console.log(JSON.stringify({ ok: true, candidates: q.length,
  video: q.filter(x => x.kind === 'video').length, image: q.filter(x => x.kind === 'image').length }, null, 2));
