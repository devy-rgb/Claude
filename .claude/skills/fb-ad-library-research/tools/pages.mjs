#!/usr/bin/env node
/* Per-advertiser page profiles — "check their pages too".
 * For every page in the run: FB page URL, likes, category, entity type, ads
 * seen, active ads, distinct creatives, CALL share (pay-per-call niches),
 * phone numbers used, CTA mix, landing domains, formats, median life, bucket.
 * Writes <run>/pages.json and <run>/pages.md (ranked by call ads, then ads).
 * Usage: node pages.mjs --niche aca --date 2026-09-12 [--root <path>]
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn, isCopy } from './lib.mjs';
import { makeCallSignals } from './calls.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const DAY = 86400, NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const CFG = loadNiche(NICHE);
const isRelevant = relevanceFn(CFG);
const callSignals = makeCallSignals(CFG);
const A = rd(path.join(RUN, 'analysis.json'), { pages: [] });
const bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
const reasonOf = Object.fromEntries(A.pages.map(p => [p.pid, p.reason]));
const ads = new Map();
for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
  for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
const byPage = new Map();
for (const a of ads.values()) {
  if (!byPage.has(a.pid)) byPage.set(a.pid, { pid: a.pid, page: a.page, ads: [] });
  byPage.get(a.pid).ads.push(a);
}
const top = (m, n = 3) => Object.entries(m).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => `${k} (${v})`);
const rows = [...byPage.values()].map(p => {
  const rel = p.ads.filter(a => isRelevant(a));
  const calls = rel.map(a => ({ a, c: callSignals(a) })).filter(x => x.c.call);
  const life = a => Math.max(0, ((a.act ? NOW : (a.end || NOW)) - (a.start || NOW)) / DAY);
  const lives = rel.map(life).sort((x, y) => x - y);
  const ctas = {}, doms = {}, fmts = {}, sigs = {}, phones = {};
  for (const a of rel) { if (a.cta) ctas[a.cta] = (ctas[a.cta] || 0) + 1; if (a.fmt) fmts[a.fmt] = (fmts[a.fmt] || 0) + 1;
    try { if (a.url && !/^tel:/i.test(a.url)) { const d = new URL(a.url).hostname.replace(/^www\./, ''); doms[d] = (doms[d] || 0) + 1; } } catch {} }
  for (const x of calls) { for (const s of x.c.call_signals) sigs[s] = (sigs[s] || 0) + 1; if (x.c.phone) phones[x.c.phone] = (phones[x.c.phone] || 0) + 1; }
  const f = p.ads[0];
  const srcs = [...new Set(p.ads.map(a => (a.src || '').replace(/^kw:/, '')))];
  return { pid: p.pid, page: p.page, bucket: bucketOf[p.pid] || 'unclassified', reason: reasonOf[p.pid] || '',
    profile: f.prof || `https://www.facebook.com/${p.pid}`, likes: p.ads.map(a => a.likes).find(v => v != null) ?? null,
    categories: f.cat || [], entity: f.ptype || null,
    ads_seen: p.ads.length, niche_ads: rel.length, active: rel.filter(a => a.act).length,
    creatives: new Set(rel.map(a => `${(a.body || '').slice(0, 80)}|${a.fmt}`)).size,
    call_ads: calls.length, call_share: rel.length ? +(calls.length / rel.length * 100).toFixed(0) : 0,
    call_signals: top(sigs, 4), phones: Object.keys(phones).slice(0, 4),
    total_coll: rel.reduce((s, a) => s + (a.coll || 1), 0),
    median_life: +(lives[Math.floor(lives.length / 2)] || 0).toFixed(0), max_life: +(lives[lives.length - 1] || 0).toFixed(0),
    ctas: top(ctas), domains: top(doms, 4), formats: top(fmts), found_via: srcs.slice(0, 5),
    full_library: p.ads.some(a => (a.src || '').startsWith('page:')),
    sample_hook: ((calls[0] && calls[0].a) || rel[0] || f).body?.split('\n').find(Boolean)?.slice(0, 160) || '',
    sample_link: `https://www.facebook.com/ads/library/?id=${((calls[0] && calls[0].a) || rel[0] || f).id}` };
}).filter(r => r.niche_ads > 0).sort((x, y) => y.call_ads - x.call_ads || y.niche_ads - x.niche_ads);
fs.writeFileSync(path.join(RUN, 'pages.json'), JSON.stringify(rows, null, 2));
const q = t => String(t || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const md = [`# Advertiser pages — ${NICHE} · ${DATE}`, '',
  `${rows.length} pages with on-niche ads · ${rows.filter(r => r.call_ads).length} run at least one call-driven ad · ${rows.filter(r => r.full_library).length} had their full library pulled.`, '',
  '**Call ads** = cta_type CALL_NOW, "Call now" CTA text, a phone number in the copy, a tel: link, or call language in the copy. Full-library pages (viewAllPageID) show their whole active library; keyword-only pages show only what the keywords surfaced.', '',
  '| # | Page | Bucket | FB page | Likes | Category | Niche ads | Active | Call ads | Call % | Signals | Phones | Dup. | Median life | CTAs | Landing domains | Full lib |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
rows.forEach((r, i) => md.push(`| ${i + 1} | ${q(r.page)} | ${r.bucket} | [page](${r.profile}) | ${r.likes ?? '?'} | ${q((r.categories || []).slice(0, 2).join(', '))} | ${r.niche_ads} | ${r.active} | ${r.call_ads} | ${r.call_share}% | ${q(r.call_signals.join(', '))} | ${q(r.phones.join(' '))} | x${r.total_coll} | ${r.median_life}d | ${q(r.ctas.join(', '))} | ${q(r.domains.join(', '))} | ${r.full_library ? 'yes' : ''} |`));
md.push('', '## Page notes', '');
for (const r of rows.filter(r => r.call_ads > 0)) md.push(`### ${r.page} (${r.pid})`, '',
  `- **Bucket**: ${r.bucket} — ${r.reason}`, `- **Page**: ${r.profile} · ${r.likes ?? '?'} likes · ${(r.categories || []).join(', ') || 'no category'}${r.entity ? ' · ' + r.entity : ''}`,
  `- **Library**: ${r.niche_ads} on-niche ads (${r.active} active, ${r.creatives} distinct creatives, total duplication x${r.total_coll}, median ${r.median_life}d, oldest ${r.max_life}d)${r.full_library ? ' — full library pulled' : ' — keyword coverage only'}`,
  `- **Call**: ${r.call_ads} ads (${r.call_share}%) · ${r.call_signals.join(', ') || '-'}${r.phones.length ? ' · numbers: ' + r.phones.join(', ') : ''}`,
  `- **CTAs**: ${r.ctas.join(', ') || '-'} · **Domains**: ${r.domains.join(', ') || '(none — native / call only)'} · **Formats**: ${r.formats.join(', ')}`,
  `- **Found via**: ${r.found_via.join(', ')}`, `- **Sample**: "${q(r.sample_hook)}" — ${r.sample_link}`, '');
fs.writeFileSync(path.join(RUN, 'pages.md'), md.join('\n'));
console.log(JSON.stringify({ ok: true, pages: rows.length, with_call_ads: rows.filter(r => r.call_ads).length,
  full_library: rows.filter(r => r.full_library).length, top: rows.slice(0, 5).map(r => `${r.page}: ${r.call_ads}/${r.niche_ads}`) }, null, 2));
