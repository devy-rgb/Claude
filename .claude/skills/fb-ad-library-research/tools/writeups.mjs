#!/usr/bin/env node
/* Emit hooks.md and angles.md — the depth files REPORT.md links to.
   Usage: node writeups.mjs --niche roofing --date 2026-09-11 [--root <path>] */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const A = JSON.parse(fs.readFileSync(path.join(RUN, 'analysis.json'), 'utf8'));
const G = JSON.parse(fs.readFileSync(path.join(RUN, 'angles.json'), 'utf8'));
const q = (t) => (t || '').replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim();

// ---------- hooks.md ----------
const H = [`# Hooks — ${NICHE} · ${DATE}`, '',
  'Verbatim opening lines, deduped by creative, max 3 per page, minimum 7 days live.',
  'DCO catalog ads excluded. Score = 45% lifespan + 35% duplication + 20% page conviction.', ''];
for (const b of ['affiliate', 'branded', 'unclassified']) {
  const list = A.hooks[b] || []; if (!list.length) continue;
  H.push(`## ${b} (${list.length} ranked)`, '',
    '| # | Hook | Page | Alive | Coll. | Format | CTA | Link |', '|---|---|---|---|---|---|---|---|');
  list.forEach((h, i) => H.push(`| ${i + 1} | ${q(h.hook).slice(0, 180)} | ${q(h.page)} | ${h.life}d | x${h.coll} | ${h.fmt || '-'} | ${h.cta || '-'} | [ad](${h.link}) |`));
  H.push('');
}
H.push('## Longest-lived creatives (30d+, deduped)', '',
  '| Alive | Coll. | Bracket | Page | Hook | Link |', '|---|---|---|---|---|---|');
for (const h of (A.longest_lived || []).slice(0, 30))
  H.push(`| ${h.life}d | x${h.coll} | ${h.bucket} | ${q(h.page)} | ${q(h.hook).slice(0, 150)} | [ad](${h.link}) |`);
H.push('', '## Creative families by total duplication', '',
  '| Family total | Ad IDs | Pages | Peak | Alive | Bracket | Hook | Link |', '|---|---|---|---|---|---|---|---|');
for (const h of (A.most_duplicated || []).slice(0, 30))
  H.push(`| x${h.family_total} | ${h.clone_ads} | ${h.pages} | x${h.coll} | ${h.life}d | ${h.bucket} | ${q(h.hook).slice(0, 130)} | [ad](${h.link}) |`);
fs.writeFileSync(path.join(RUN, 'hooks.md'), H.join('\n'));

// ---------- angles.md ----------
const tbl = (rows) => ['| Angle | Ads | Share | Strength | Pages | Median life |', '|---|---|---|---|---|---|']
  .concat(rows.map(r => `| ${r.name} | ${r.ads} | ${r.share}% | ${r.strength} | ${r.pages} | ${r.median_life}d |`));
const M = [`# Angles & triggers — ${NICHE} · ${DATE}`, '',
  `${G.total} on-niche ads tagged. An ad can carry more than one angle, so shares sum above 100%.`,
  'Tagging is regex-first; the report writer reads the copy on top of it.', '',
  '## Angles — affiliate', '', ...tbl(G.angles.affiliate), '',
  '## Angles — branded', '', ...tbl(G.angles.branded), '',
  '## Triggers — affiliate', '', ...tbl(G.triggers.affiliate), '',
  '## Triggers — branded', '', ...tbl(G.triggers.branded), '',
  '## Every angle, with its highest-conviction example', ''];
for (const a of G.angles.all) {
  const ex = G.rows.filter(r => r.angles.includes(a.name))
    .sort((x, y) => (y.coll * Math.min(y.life, 90)) - (x.coll * Math.min(x.life, 90)))[0];
  if (!ex) continue;
  M.push(`### ${a.name} — ${a.ads} ads (${a.share}%), median ${a.median_life}d`, '',
    `> "${q(ex.hook).slice(0, 200)}"`, '',
    `${ex.page} · ${ex.bucket} · ${ex.life}d · x${ex.coll} · [ad](${ex.link})`, '');
}
fs.writeFileSync(path.join(RUN, 'angles.md'), M.join('\n'));
console.log(JSON.stringify({ ok: true, wrote: ['hooks.md', 'angles.md'] }));
