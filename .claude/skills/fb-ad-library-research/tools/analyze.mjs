#!/usr/bin/env node
/* Ad Library run analyzer.
   Usage: node analyze.mjs --niche roofing --date 2026-09-11 [--root <path>]
   Reads  _reports/<date>/raw/*.json
   Writes bucket/page/date archives, _state/*, activity.md, landing-pages.md, analysis.json */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { loadNiche, relevanceFn, copyFn, PLACEHOLDER, slug, norm, STATES, chash, rx } from './lib.mjs';

const argv = Object.fromEntries(process.argv.slice(2).join(' ')
  .split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));

const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE);
const RUN = path.join(BASE, '_reports', DATE);
const STATE = path.join(BASE, '_state');
const DAY = 86400;
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);

const NICHECFG = loadNiche(NICHE);
const isRelevant = relevanceFn(NICHECFG);
const isCopy = copyFn(NICHECFG);

const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const wr = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof o === 'string' ? o : JSON.stringify(o, null, 2)); };

// ---------- load raw ----------
const rawDir = path.join(RUN, 'raw');
if (!fs.existsSync(rawDir)) { console.error('no raw dir: ' + rawDir); process.exit(1); }
const ads = new Map();
for (const f of fs.readdirSync(rawDir).filter(f => f.endsWith('.json')).sort()) {
  for (const a of (rd(path.join(rawDir, f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
}
const ALL = [...ads.values()];
if (!ALL.length) { console.error('no ads in raw'); process.exit(1); }

// ---------- derived ----------

for (const a of ALL) {
  a.hash = chash(a);
  const end = a.act ? NOW : (a.end || NOW);
  a.life = Math.max(0, (end - (a.start || end)) / DAY);
  a.link = `https://www.facebook.com/ads/library/?id=${a.id}`;
  try { a.domain = a.url ? new URL(a.url).hostname.replace(/^www\./, '') : null; } catch { a.domain = null; }
  try { a.path = a.url ? new URL(a.url).pathname : null; } catch { a.path = null; }
  a.hook = (a.body || '').split('\n').map(s => s.trim()).find(Boolean) || a.title || '';
  // on-niche? multi-vertical affiliate pages run bathroom/window/siding offers too.
  a.rel = isRelevant(a);
}
const REL = ALL.filter(a => a.rel);

// ---------- classify ----------
const cls = rd(path.join(STATE, 'classification.json'), {});
const CLS = NICHECFG.classify || {};
const AGG_NAME = rx(CLS.agg_name || /(find my|request|upgrading|home ?pros|home[- ]improvements?|smart (lifestyle|savers|life)|daily lifestyle|relief program|fetchapro|wallet|money|savers club|quotes?|compare|my home)/i);
const PERSONA = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
const PROGRAM = rx(CLS.program || /(relief program|you (may )?qualify|see if you qualify|eligib|government|stimulus|homeowners? (in|are)|approved for|entitled|program (is|now)|no cost to you|funding)/i);
const QUIZFUNNEL = rx(CLS.quiz_funnel || /\/(quiz|survey|qualify|check|lp|s|apply|start|step)\b/i);
const TRACKER = rx(CLS.tracker || /(clickflare|redtrack|voluum|everflow|trk\.|track\.|go\.|click\.|r\.|link\.)/i);
const TRACKPARAM = rx(CLS.track_param || /(sub_?id|clickid|aff_?id|utm_source=fb.*aff|ttclid|gclid=|oid=)/i);
const BRANDSIG = rx(CLS.brand_sig || /(gaf|owens corning|certainteed|master elite|licensed|insured|family[- ]owned|since \d{4}|financing|warranty|free estimate|serving)/i);
const TRADECAT = rx(CLS.trade_category || /construction|contractor|roofing|home improvement/i);

const byPage = new Map();
for (const a of ALL) {
  if (!byPage.has(a.pid)) byPage.set(a.pid, { pid: a.pid, page: a.page, ads: [] });
  byPage.get(a.pid).ads.push(a);
}

for (const p of byPage.values()) {
  const man = cls[p.pid];
  if (man && man.manual) { p.bucket = man.bucket; p.reason = man.reason + ' (manual)'; p.score = man.score || {}; continue; }
  let af = 0, br = 0; const why = [];
  const txt = p.ads.map(a => `${a.body} ${a.title}`).join(' ');
  const doms = [...new Set(p.ads.map(a => a.domain).filter(Boolean))];
  const paths = p.ads.map(a => a.path || '').join(' ');
  const urls = p.ads.map(a => a.url || '').join(' ');
  // A two-word brand ('Concealed Coalition') is not a persona: names carrying niche vocabulary are excluded.
  const personaName = PERSONA.test(p.page) && !(CLS.persona_exclude && rx(CLS.persona_exclude).test(p.page)), aggName = AGG_NAME.test(p.page);
  if (personaName) { af += 2; why.push('persona page name'); }
  if (aggName) { af += 2; why.push('aggregator-style name'); }
  if (PROGRAM.test(txt)) { af += 2; why.push('program/eligibility framing'); }
  if (QUIZFUNNEL.test(paths)) { af += 2; why.push('quiz/multi-step funnel path'); }
  if (TRACKER.test(doms.join(' ')) || TRACKPARAM.test(urls)) { af += 2; why.push('tracker domain/params'); }
  const st = new Set((txt.toLowerCase().match(STATES) || [])); if (st.size >= 5) { af += 2; why.push(`${st.size} states in copy`); }
  const likes = p.ads.map(a => a.likes).find(v => v != null);
  const LOW_LIKES = CLS.low_likes_max ?? 5000, LOW_ADS = CLS.low_likes_min_ads ?? 40;
  if (likes != null && likes < LOW_LIKES && p.ads.length >= LOW_ADS) { af += 2; why.push(`${likes} likes vs ${p.ads.length} active ads`); }
  // A page whose category has nothing to do with the niche (a "Gym" or "Chef"
  // page running permit ads) is renting its audience out — an affiliate tell.
  if (CLS.mismatch_category && (p.ads[0].cat || []).some(c => rx(CLS.mismatch_category).test(c))) { af += 2; why.push(`off-niche page category: ${(p.ads[0].cat || []).join('/')}`); }
  // A domain matching the page name only indicates a real brand when the name
  // itself is a brand. "Request Home Pros" -> requestpros.com is an aggregator
  // matching its own funnel domain, which is an affiliate tell, not a branded one.
  const nameDom = doms.some(d => d && slug(p.page).split('-').filter(w => w.length > 3).some(w => d.includes(w)));
  if (nameDom && !aggName && !personaName) { br += 2; why.push('domain matches page name'); }
  if (BRANDSIG.test(txt)) { br += 2; why.push('brand/credential signals'); }
  if (CLS.brand_sig_strong && rx(CLS.brand_sig_strong).test(txt)) { br += 2; why.push('itemised business specifics (venue, fee, date, phone)'); }
  if ((p.ads[0].cat || []).some(c => TRADECAT.test(c)) && p.ads.length < 25) { br += 1; why.push('trade category, small library'); }
  p.score = { affiliate: af, branded: br };
  p.bucket = (af >= 2 && af > br) ? 'affiliate' : (br >= 2 && br > af) ? 'branded' : 'unclassified';
  p.reason = why.join('; ') || 'insufficient signal';
  cls[p.pid] = { page_name: p.page, bucket: p.bucket, reason: p.reason, score: p.score,
    manual: false, decided: DATE, history: (cls[p.pid]?.history || []).concat(
      cls[p.pid] && cls[p.pid].bucket !== p.bucket ? [{ date: cls[p.pid].decided, bucket: cls[p.pid].bucket }] : []) };
}

// ---------- new vs reused ----------
const seen = rd(path.join(STATE, 'seen-ads.json'), {});
// Re-running analysis for the SAME date must be idempotent — the doctrine says
// fix the analyzer and re-run against raw/ rather than re-harvesting. An ad
// first seen on this very run still counts as new the second time through.
const firstSeenThisRun = id => seen[id] && seen[id].first_seen === DATE;
const BASELINE = Object.keys(seen).length === 0
  || Object.values(seen).every(v => v.first_seen === DATE);
const hashesBefore = new Set(Object.values(seen)
  .filter(v => v.creative_hash && v.first_seen !== DATE).map(v => v.creative_hash));
for (const a of ALL) {
  a.isNew = !seen[a.id] || firstSeenThisRun(a.id);
  a.newCreative = a.isNew && !hashesBefore.has(a.hash);
  a.relaunch = a.isNew && hashesBefore.has(a.hash);
}

// ---------- lifespan ----------
const BUCKETS = [['0-3d', 0, 3], ['3-7d', 3, 7], ['7-14d', 7, 14], ['14-30d', 14, 30],
                 ['30-60d', 30, 60], ['60-90d', 60, 90], ['90d+', 90, Infinity]];
const bucketOf = d => (BUCKETS.find(([, lo, hi]) => d >= lo && d < hi) || BUCKETS[BUCKETS.length - 1])[0];
function lifeTable(list) {
  const t = {};
  for (const [n] of BUCKETS) t[n] = { ads: 0, new: 0, strength: 0 };
  for (const a of list) { const b = t[bucketOf(a.life)]; b.ads++; if (a.isNew) b.new++; b.strength += (a.coll || 1); }
  return t;
}

// ---------- history + deltas ----------
const hist = rd(path.join(STATE, 'history.json'), {});
const lastRun = rd(path.join(STATE, 'last-run.json'), null);
const prevDate = lastRun && lastRun.date !== DATE ? lastRun.date : null;
const gapDays = prevDate ? Math.round((Date.parse(DATE) - Date.parse(prevDate)) / 86400000) : null;
const prevOf = pid => { const r = (hist[pid]?.runs || []).filter(r => r.date !== DATE); return r[r.length - 1] || null; };
const pct = (n, o) => (o == null) ? null : (o === 0 ? (n === 0 ? '--' : 'NEW') : `${((n - o) / o * 100).toFixed(1)}%`);

const pages = [];
for (const p of byPage.values()) {
  p.relAds = p.ads.filter(a => a.rel);
  const lt = lifeTable(p.relAds.length ? p.relAds : p.ads);
  const newAds = p.ads.filter(a => a.isNew).length;
  const newCre = new Set(p.ads.filter(a => a.newCreative).map(a => a.hash)).size;
  const rec = {
    date: DATE, total_active: p.ads.filter(a => a.act).length, total_seen: p.ads.length,
    niche_ads: p.relAds.length, niche_share: +(p.relAds.length / p.ads.length).toFixed(2),
    new_ads: newAds, reused_ads: p.ads.length - newAds,
    creatives_distinct: new Set(p.ads.map(a => a.hash)).size,
    new_creatives: newCre, relaunched: p.ads.filter(a => a.relaunch).length,
    reuse_ratio: +(newAds / Math.max(newCre, 1)).toFixed(2),
    lifespan_buckets: Object.fromEntries(Object.entries(lt).map(([k, v]) => [k, v.ads])),
    lifespan_detail: lt,
    median_life: +(p.ads.map(a => a.life).sort((a, b) => a - b)[Math.floor(p.ads.length / 2)] || 0).toFixed(1),
    landing_domains: [...new Set(p.ads.map(a => a.domain).filter(Boolean))],
    top_cta: Object.entries(p.ads.reduce((m, a) => (a.cta && (m[a.cta] = (m[a.cta] || 0) + 1), m), {}))
      .sort((x, y) => y[1] - x[1])[0]?.[0] || null,
    partial: false
  };
  const prev = prevOf(p.pid);
  rec.delta = prev ? {
    total_active: rec.total_active - prev.total_active, total_active_pct: pct(rec.total_active, prev.total_active),
    new_ads: rec.new_ads - prev.new_ads, new_ads_pct: pct(rec.new_ads, prev.new_ads)
  } : null;
  hist[p.pid] = hist[p.pid] || { page_name: p.page, bucket: p.bucket, runs: [] };
  hist[p.pid].page_name = p.page; hist[p.pid].bucket = p.bucket;
  hist[p.pid].runs = hist[p.pid].runs.filter(r => r.date !== DATE).concat([rec]);
  p.rec = rec; p.prev = prev;
  pages.push(p);
}

// ---------- bracket rollups ----------
const bracket = b => REL.filter(a => byPage.get(a.pid).bucket === b);
function bracketRoll(b) {
  const list = bracket(b);
  const lt = lifeTable(list);
  const prevB = rd(path.join(STATE, 'bracket-history.json'), {})[b];
  const prevRun = prevB ? (prevB.runs || []).filter(r => r.date !== DATE).pop() : null;
  const out = { bucket: b, date: DATE, ads: list.length,
    pages: new Set(list.map(a => a.pid)).size,
    new_ads: list.filter(a => a.isNew).length,
    creatives: new Set(list.map(a => a.hash)).size,
    table: Object.entries(lt).map(([period, v]) => ({
      period, ads: v.ads, new: v.new, strength: v.strength,
      ads_pct: prevRun ? pct(v.ads, prevRun.tableMap?.[period]?.ads) : null,
      new_pct: prevRun ? pct(v.new, prevRun.tableMap?.[period]?.new) : null,
      strength_pct: prevRun ? pct(v.strength, prevRun.tableMap?.[period]?.strength) : null
    })), tableMap: lt };
  return out;
}
const brackets = ['affiliate', 'branded', 'unclassified'].map(bracketRoll);
const bh = rd(path.join(STATE, 'bracket-history.json'), {});
for (const b of brackets) { bh[b.bucket] = bh[b.bucket] || { runs: [] };
  bh[b.bucket].runs = bh[b.bucket].runs.filter(r => r.date !== DATE).concat([b]); }

// ---------- write per-page archive ----------
for (const p of pages) {
  const dir = path.join(BASE, p.bucket, slug(p.page) + (byPage.size > 1 && [...byPage.values()].filter(x => slug(x.page) === slug(p.page)).length > 1 ? '-' + p.pid : ''));
  wr(path.join(dir, '_page.json'), { page_id: p.pid, page_name: p.page, bucket: p.bucket,
    reason: p.reason, score: p.score, profile: p.ads[0].prof || null,
    likes: p.ads.map(a => a.likes).find(v => v != null) ?? null,
    categories: p.ads[0].cat || [], first_seen: rd(path.join(dir, '_page.json'), {}).first_seen || DATE, last_seen: DATE });
  const d = path.join(dir, DATE);
  wr(path.join(d, 'ads.json'), p.ads);
  wr(path.join(d, 'activity.json'), p.rec);
  wr(path.join(d, 'landing-pages.txt'), [...new Set(p.ads.map(a => a.url).filter(Boolean))].join('\n'));
  const md = [`# ${p.page}`, ``, `- Bucket: **${p.bucket}** — ${p.reason}`,
    `- Page ID: ${p.pid}${p.ads[0].prof ? ' · ' + p.ads[0].prof : ''}`,
    `- Active ads: ${p.rec.total_active} · distinct creatives: ${p.rec.creatives_distinct} · median life: ${p.rec.median_life}d`, ``,
    `## Ads`, ``].concat(p.ads.sort((a, b) => b.life - a.life).map(a =>
      [`### ${a.id} — ${a.life.toFixed(0)}d alive${a.isNew ? ' · NEW' : ''}${a.coll > 1 ? ' · x' + a.coll : ''}`,
       `- ${a.link}`, `- Format: ${a.fmt} · CTA: ${a.cta || '-'}`,
       `- Landing: ${a.url || '-'}`,
       a.title ? `- Title: ${a.title}` : '', `- Hook: ${a.hook.slice(0, 200)}`,
       '', '```', (a.body || '').slice(0, 900), '```', ''].filter(Boolean).join('\n')));
  wr(path.join(d, 'ads.md'), md.join('\n'));
}

// ---------- run-level outputs ----------
const domains = {};
for (const a of REL) if (a.domain) {
  domains[a.domain] = domains[a.domain] || { domain: a.domain, ads: 0, pages: new Set(), paths: new Set(), buckets: new Set() };
  const d = domains[a.domain]; d.ads++; d.pages.add(a.page); if (a.path) d.paths.add(a.path); d.buckets.add(byPage.get(a.pid).bucket);
}
const domList = Object.values(domains).map(d => ({ domain: d.domain, ads: d.ads, pages: [...d.pages],
  paths: [...d.paths].slice(0, 12), buckets: [...d.buckets] })).sort((a, b) => b.ads - a.ads);
const seenDom = rd(path.join(STATE, 'seen-domains.json'), {});
for (const d of domList) { d.first_seen = seenDom[d.domain] || DATE; d.isNew = seenDom[d.domain] == null; seenDom[d.domain] = d.first_seen; }

wr(path.join(RUN, 'landing-pages.md'),
  ['# Landing pages', '', `Run ${DATE} · ${domList.length} domains · ${domList.filter(d => d.isNew).length} new`, '',
   '| Domain | Ads | Buckets | Pages | New | Example paths |', '|---|---|---|---|---|---|']
   .concat(domList.map(d => `| ${d.domain} | ${d.ads} | ${d.buckets.join(',')} | ${d.pages.slice(0, 3).join(', ')}${d.pages.length > 3 ? ` +${d.pages.length - 3}` : ''} | ${d.isNew ? '**yes**' : ''} | ${d.paths.slice(0, 3).join(' ') || '/'} |`)).join('\n'));

const fmtD = v => v == null ? '--' : v;
const actLines = ['# Ad activity over time', '', `Run ${DATE}${prevDate ? ` · prev ${prevDate} (${gapDays}d ago)` : ' · **baseline run, no prior week**'}`, ''];
for (const b of brackets.filter(b => b.ads)) {
  actLines.push(`## Creative life span — ${b.bucket} (${b.ads} ads, ${b.pages} pages)`, '',
    '| Period | # Ads | WoW | New Ads | WoW | Strength (30D) | WoW |', '|---|---|---|---|---|---|---|');
  for (const r of b.table) actLines.push(`| ${r.period} | ${r.ads} | ${fmtD(r.ads_pct)} | ${r.new} | ${fmtD(r.new_pct)} | ${r.strength} | ${fmtD(r.strength_pct)} |`);
  actLines.push('');
}
actLines.push('## Launches by page', '', '| Page | Bucket | Active | WoW | New | Re-used | New creatives | Relaunched | Reuse ratio | Mode | Median life |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const p of pages.sort((a, b) => b.rec.total_active - a.rec.total_active)) {
  const r = p.rec, mode = r.reuse_ratio > 5 ? 'scaling' : r.reuse_ratio > 2 ? 'mixed' : 'testing';
  actLines.push(`| ${p.page} | ${p.bucket} | ${r.total_active} | ${fmtD(r.delta?.total_active_pct)} | ${r.new_ads} | ${r.reused_ads} | ${r.new_creatives} | ${r.relaunched} | ${r.reuse_ratio} | ${BASELINE ? '--' : mode} | ${r.median_life}d |`);
}
wr(path.join(RUN, 'activity.md'), actLines.join('\n'));

// ---------- analysis.json for the report writer ----------
// DCO/catalog ads render as unresolved template vars ({{product.brand}}) and
// carry no real copy — they are not hooks. Exclude them from every ranking.
const isHook = a => a.hook.length > 15 && !PLACEHOLDER.test(a.hook)
  && !PLACEHOLDER.test(a.title || '') && isCopy(a);
const topHooks = b => {
  const list = bracket(b).filter(a => a.life >= 7 && isHook(a));
  const lp = [...list].sort((x, y) => x.life - y.life), cp = [...list].sort((x, y) => (x.coll || 1) - (y.coll || 1));
  const pageTot = {}; for (const a of list) pageTot[a.pid] = (pageTot[a.pid] || 0) + 1;
  const hookCount = {}; for (const a of list) { const k = norm(a.hook).slice(0, 80); hookCount[k] = (hookCount[k] || 0) + 1; }
  return list.map(a => ({ ...a, score: +(0.45 * (lp.indexOf(a) / Math.max(list.length - 1, 1))
      + 0.35 * (cp.indexOf(a) / Math.max(list.length - 1, 1))
      + 0.20 * (hookCount[norm(a.hook).slice(0, 80)] / Math.max(pageTot[a.pid], 1))).toFixed(3) }))
    .sort((x, y) => y.score - x.score)
    .filter((a, i, arr) => arr.findIndex(z => z.hash === a.hash) === i)
    .filter((a, i, arr) => arr.findIndex(z => norm(z.hook).slice(0, 60) === norm(a.hook).slice(0, 60)) === i)
    .filter((a, i, arr) => arr.filter((z, j) => j < i && z.pid === a.pid).length < 3)  // max 3 per page
    .slice(0, 25)
    .map(a => ({ hook: a.hook.slice(0, 220), page: a.page, pid: a.pid, life: +a.life.toFixed(0), coll: a.coll,
                 fmt: a.fmt, cta: a.cta, url: a.url, link: a.link, id: a.id, title: a.title, score: a.score, isNew: a.isNew }));
};
const analysis = {
  niche: NICHE, date: DATE, prev_date: prevDate, gap_days: gapDays, baseline: BASELINE,
  totals: { ads: ALL.length, niche_ads: REL.length, pages: byPage.size,
    niche_pages: new Set(REL.map(a => a.pid)).size,
    by_bucket: Object.fromEntries(brackets.map(b => [b.bucket, { ads: b.ads, pages: b.pages }])) },
  brackets, pages: pages.map(p => ({ pid: p.pid, page: p.page, bucket: p.bucket, reason: p.reason, score: p.score, ...p.rec })),
  hooks: { affiliate: topHooks('affiliate'), branded: topHooks('branded'), unclassified: topHooks('unclassified') },
  longest_lived: REL.filter(a => a.life >= 30 && isHook(a))
    .filter((a, i, arr) => arr.findIndex(z => z.hash === a.hash) === i).sort((a, b) => (b.coll * b.life) - (a.coll * a.life)).slice(0, 40)
    .map(a => ({ id: a.id, page: a.page, bucket: byPage.get(a.pid).bucket, life: +a.life.toFixed(0), coll: a.coll,
                 fmt: a.fmt, hook: a.hook.slice(0, 200), title: a.title, url: a.url, link: a.link, vid: !!a.vid })),
  // Group clones by creative, then rank by TOTAL duplication across the family.
  // A creative running as 499 near-identical ad IDs is the single loudest spend
  // signal in the dataset; ranking individual clones would bury it.
  most_duplicated: (() => {
    const fam = new Map();
    for (const a of REL.filter(isHook)) {
      const f = fam.get(a.hash) || { total: 0, ads: 0, pages: new Set(), best: a };
      f.total += (a.coll || 1); f.ads++; f.pages.add(a.pid);
      if ((a.coll || 1) > (f.best.coll || 1) || ((a.coll || 1) === (f.best.coll || 1) && a.life > f.best.life)) f.best = a;
      fam.set(a.hash, f);
    }
    return [...fam.values()].sort((x, y) => y.total - x.total).slice(0, 30).map(f => ({
      id: f.best.id, page: f.best.page, bucket: byPage.get(f.best.pid).bucket,
      coll: f.best.coll, family_total: f.total, clone_ads: f.ads, pages: [...f.pages].length,
      page_names: [...new Set(REL.filter(a => a.hash === f.best.hash).map(a => a.page))].slice(0, 8),
      life: +f.best.life.toFixed(0), hook: f.best.hook.slice(0, 160), link: f.best.link, url: f.best.url }));
  })(),
  domains: domList.slice(0, 80),
  unclassified_pages: pages.filter(p => p.bucket === 'unclassified')
    .map(p => ({ page: p.page, pid: p.pid, ads: p.ads.length, score: p.score, reason: p.reason,
                 domains: p.rec.landing_domains, sample: p.ads[0].hook.slice(0, 160), link: p.ads[0].link }))
};
wr(path.join(RUN, 'analysis.json'), analysis);

// ---------- persist state ----------
for (const a of ALL) if (!seen[a.id]) seen[a.id] = { first_seen: DATE, page_id: a.pid, creative_hash: a.hash };
wr(path.join(STATE, 'seen-ads.json'), seen);
wr(path.join(STATE, 'seen-domains.json'), seenDom);
wr(path.join(STATE, 'history.json'), hist);
wr(path.join(STATE, 'bracket-history.json'), bh);
wr(path.join(STATE, 'classification.json'), cls);
wr(path.join(STATE, 'last-run.json'), { date: DATE, ads: ALL.length, pages: byPage.size, baseline: BASELINE });

console.log(JSON.stringify({ ok: true, date: DATE, baseline: BASELINE, ads: ALL.length,
  niche_ads: REL.length, pages: byPage.size,
  buckets: Object.fromEntries(brackets.map(b => [b.bucket, b.ads])),
  wrote: [path.join(RUN, 'analysis.json'), path.join(RUN, 'activity.md'), path.join(RUN, 'landing-pages.md')] }, null, 2));
