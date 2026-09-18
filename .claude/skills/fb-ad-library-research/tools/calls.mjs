#!/usr/bin/env node
/* Call-driven tagging for pay-per-call niches (ACA, Medicare, legal…).
 * A creative is CALL-DRIVEN when any of these fire (config `call_signals`):
 *   cta:CALL_NOW     — Meta cta_type CALL_NOW (the phone number itself is NOT
 *                      exposed in the Ad Library payload, only the CTA type)
 *   cta:call-text    — CTA text is "Call now" / "Call us" without the type
 *   phone-in-copy    — a US phone number in body / title / link description
 *   tel-link         — link_url is tel:
 *   call-language    — "call now", "speak to a licensed agent", "tap to call"…
 *
 * Enriches <run>/creatives-manifest.json IN PLACE (adds call, call_signals,
 * phone) — every downstream reader (score, hookfiles, top) inherits the fields
 * — and writes <run>/calls.json: call share by bucket, signal mix, phone
 * numbers with the pages that use them, CTA-type distribution.
 * Runs after manifest.mjs. No-op on niches without `call_signals`.
 * Usage: node calls.mjs --niche aca --date 2026-09-12 [--root <path>]
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn, rx } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

export function makeCallSignals(cfg) {
  const CS = (cfg || {}).call_signals || null;
  if (!CS) return () => ({ call: false, call_signals: [], phone: null, anti_call: false });
  const phoneRe = CS.phone_regex ? rx(CS.phone_regex, '') : null;
  const copyRe = CS.copy_regex ? rx(CS.copy_regex) : null;
  const antiRe = CS.anti_regex ? rx(CS.anti_regex) : null;
  const ctaTextRe = CS.cta_text ? rx(CS.cta_text) : null;
  const ctaTypes = new Set(CS.cta_types || []);
  const digits = ph => ph ? ph.replace(/[^\d]/g, '').replace(/^1(?=\d{10}$)/, '') : null;
  return (a) => {
    const sig = []; const t = `${a.body || ''}\n${a.title || ''}\n${a.ldesc || ''}\n${a.cap || ''}`;
    // hard signals: the ad itself is wired for a call
    if (a.ctat && ctaTypes.has(a.ctat)) sig.push('cta:CALL_NOW');
    else if (ctaTextRe && a.cta && ctaTextRe.test(a.cta.trim())) sig.push('cta:call-text');
    let ph = phoneRe ? (t.match(phoneRe) || [])[0] : null;
    if (ph) sig.push('phone-in-copy');
    const tel = [a.url || '', ...((a.xlinks || []).map(String))].find(u => /^tel:/i.test(u));
    if (tel) { sig.push('tel-link'); if (!ph) ph = tel.replace(/^tel:/i, ''); }
    // soft signal: call language — suppressed when the ad explicitly promises NO call
    const anti = !!(antiRe && antiRe.test(t));
    if (!anti && copyRe && copyRe.test(t)) sig.push('call-language');
    return { call: sig.length > 0, call_signals: sig, phone: digits(ph), anti_call: anti };
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const CFG = loadNiche(NICHE);
  const callSignals = makeCallSignals(CFG);
  const isRelevant = relevanceFn(CFG);
  if (!CFG.call_signals) { console.log(JSON.stringify({ ok: true, skipped: 'no call_signals in niche config' })); process.exit(0); }
  const ads = new Map();
  for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
    for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
  const A = rd(path.join(RUN, 'analysis.json'), { pages: [] });
  const bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
  const tagged = [...ads.values()].filter(isRelevant).map(a => ({ a, c: callSignals(a) }));
  const byId = Object.fromEntries(tagged.map(x => [x.a.id, x.c]));
  const mp = path.join(RUN, 'creatives-manifest.json');
  const manifest = rd(mp, null);
  let enriched = 0;
  if (manifest) {
    const famCall = new Map();
    const key = a => `${(a.body || '').slice(0, 200)}|${(a.title || '').slice(0, 100)}|${a.fmt || ''}`;
    for (const x of tagged) if (x.c.call) {
      const f = famCall.get(key(x.a)) || { sigs: new Set(), phones: new Set() };
      x.c.call_signals.forEach(s => f.sigs.add(s)); if (x.c.phone) f.phones.add(x.c.phone); famCall.set(key(x.a), f);
    }
    for (const m of manifest) {
      const own = byId[m.id] || { call: false, call_signals: [], phone: null };
      const f = famCall.get(key(m));
      m.call = own.call || !!f;
      m.call_signals = own.call ? own.call_signals : (f ? [...f.sigs] : []);
      m.phone = own.phone || (f ? [...f.phones][0] || null : null);
      if (m.call) enriched++;
    }
    fs.writeFileSync(mp, JSON.stringify(manifest, null, 1));
  }
  const share = (list) => { const n = list.length, c = list.filter(x => x.c.call).length; return { ads: n, call_ads: c, call_share: n ? +(c / n * 100).toFixed(1) : 0 }; };
  const byBucket = {}; for (const b of ['affiliate', 'branded', 'unclassified']) byBucket[b] = share(tagged.filter(x => (bucketOf[x.a.pid] || 'unclassified') === b));
  const sigMix = {}; for (const x of tagged) for (const s of x.c.call_signals) sigMix[s] = (sigMix[s] || 0) + 1;
  const antiList = tagged.filter(x => x.c.anti_call);
  const ctat = {}; for (const x of tagged) ctat[x.a.ctat || 'none'] = (ctat[x.a.ctat || 'none'] || 0) + 1;
  const phones = {}; for (const x of tagged) if (x.c.phone) { const p = phones[x.c.phone] || { ads: 0, pages: new Set(), coll: 0 }; p.ads++; p.pages.add(x.a.page); p.coll += (x.a.coll || 1); phones[x.c.phone] = p; }
  const pages = {}; for (const x of tagged) { const p = pages[x.a.pid] || { page: x.a.page, pid: x.a.pid, bucket: bucketOf[x.a.pid] || 'unclassified', ads: 0, call: 0, coll: 0, callNow: 0 }; p.ads++; p.coll += (x.a.coll || 1); if (x.c.call) p.call++; if (x.c.call_signals.includes('cta:CALL_NOW')) p.callNow++; pages[x.a.pid] = p; }
  const out = { date: DATE, niche: NICHE, total: share(tagged), by_bucket: byBucket, signal_mix: sigMix, cta_types: ctat,
    anti_call: { ads: antiList.length, coll: antiList.reduce((s, x) => s + (x.a.coll || 1), 0), pages: [...new Set(antiList.map(x => x.a.page))],
      ads_list: antiList.map(x => ({ id: x.a.id, page: x.a.page, bucket: bucketOf[x.a.pid] || 'unclassified', coll: x.a.coll || 1, hook: (x.a.body || '').split('\n').find(Boolean)?.slice(0, 160) || '', title: (x.a.title || '').slice(0, 120), url: x.a.url, link: `https://www.facebook.com/ads/library/?id=${x.a.id}` })) },
    phones: Object.entries(phones).map(([n, p]) => ({ phone: n, ads: p.ads, coll: p.coll, pages: [...p.pages] })).sort((a, b) => b.coll - a.coll),
    pages: Object.values(pages).filter(p => p.call).sort((a, b) => b.call - a.call || b.coll - a.coll),
    ads: tagged.filter(x => x.c.call).map(x => ({ id: x.a.id, pid: x.a.pid, page: x.a.page, bucket: bucketOf[x.a.pid] || 'unclassified', coll: x.a.coll || 1, act: x.a.act, start: x.a.start, fmt: x.a.fmt, cta: x.a.cta, ctat: x.a.ctat, signals: x.c.call_signals, phone: x.c.phone, url: x.a.url, hook: (x.a.body || '').split('\n').find(Boolean)?.slice(0, 200) || x.a.title || '', link: `https://www.facebook.com/ads/library/?id=${x.a.id}` })) };
  fs.writeFileSync(path.join(RUN, 'calls.json'), JSON.stringify(out, null, 2));
  // ---- calls.md: the human-readable call cut ----
  const q = t => String(t || '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
  const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);
  const lifeOf = a => Math.max(0, ((a.act ? NOW : (a.end || NOW)) - (a.start || NOW)) / 86400);
  const L = [`# Call-driven ads — ${NICHE} · ${DATE}`, '',
    `${out.total.call_ads} of ${out.total.ads} on-niche ads (${out.total.call_share}%) push a phone call. ` +
    `Signals: cta:CALL_NOW = Meta's click-to-call button (number not exposed in the Library); phone-in-copy = a number written into the ad; call-language = "call now" / "speak to a licensed agent" wording; tel-link = tel: destination.`, '',
    '## Share by bracket', '', '| Bracket | On-niche ads | Call ads | Call share |', '|---|---|---|---|'];
  for (const [b, v] of Object.entries(byBucket)) L.push(`| ${b} | ${v.ads} | ${v.call_ads} | ${v.call_share}% |`);
  L.push('', '## Signal mix', '', '| Signal | Ads |', '|---|---|');
  for (const [k, v] of Object.entries(sigMix).sort((x, y) => y[1] - x[1])) L.push(`| ${k} | ${v} |`);
  if (out.anti_call.ads) { L.push('', `## Anti-call ads — ${out.anti_call.ads} ads (dup. x${out.anti_call.coll}) on ${out.anti_call.pages.length} page(s) explicitly promise NO phone call`, '', '| Page | Bucket | Dup. | Title | Hook | Link |', '|---|---|---|---|---|---|');
    for (const x of out.anti_call.ads_list.sort((a, b) => b.coll - a.coll).slice(0, 25)) L.push(`| ${q(x.page)} | ${x.bucket} | x${x.coll} | ${q(x.title).slice(0, 80)} | ${q(x.hook).slice(0, 110)} | [ad](${x.link}) |`); }
  L.push('', '## CTA types across all on-niche ads', '', '| CTA type | Ads |', '|---|---|');
  for (const [k, v] of Object.entries(ctat).sort((x, y) => y[1] - x[1])) L.push(`| ${k} | ${v} |`);
  L.push('', '## Pages running call ads', '', '| # | Page | Bucket | On-niche ads | Call ads | CALL_NOW | Dup. |', '|---|---|---|---|---|---|---|');
  out.pages.forEach((r, i) => L.push(`| ${i + 1} | ${q(r.page)} | ${r.bucket} | ${r.ads} | ${r.call} | ${r.callNow} | x${r.coll} |`));
  if (out.phones.length) { L.push('', '## Phone numbers written into copy', '', '| Number | Ads | Dup. | Pages |', '|---|---|---|---|');
    for (const r of out.phones) L.push(`| ${r.phone} | ${r.ads} | x${r.coll} | ${q(r.pages.slice(0, 4).join(', '))}${r.pages.length > 4 ? ` +${r.pages.length - 4}` : ''} |`); }
  L.push('', '## Every call-driven ad, by page', '');
  const byP = {}; for (const x of tagged.filter(x => x.c.call)) (byP[x.a.pid] = byP[x.a.pid] || []).push(x);
  for (const pid of Object.keys(byP).sort((a, b) => byP[b].length - byP[a].length)) {
    const list = byP[pid].sort((a, b) => lifeOf(b.a) - lifeOf(a.a));
    L.push(`### ${q(list[0].a.page)} — ${list.length} call ad(s) · ${bucketOf[pid] || 'unclassified'}`, '');
    for (const x of list.slice(0, 12)) L.push(`- **${Math.round(lifeOf(x.a))}d** · x${x.a.coll || 1} · ${x.a.fmt || '?'} · CTA ${x.a.cta || '-'} · ${x.c.call_signals.join(', ')}${x.c.phone ? ' · ' + x.c.phone : ''} — "${q((x.a.body || '').split('\n').find(Boolean) || x.a.title).slice(0, 160)}" [ad](https://www.facebook.com/ads/library/?id=${x.a.id})${x.a.url ? ` · [lp](${x.a.url})` : ''}`);
    if (list.length > 12) L.push(`- … ${list.length - 12} more in calls.json`);
    L.push('');
  }
  fs.writeFileSync(path.join(RUN, 'calls.md'), L.join('\n'));
  console.log(JSON.stringify({ ok: true, ...out.total, by_bucket: byBucket, signal_mix: sigMix, anti_call_ads: antiList.length, anti_call_pages: out.anti_call.pages.length, manifest_call_creatives: enriched, phones: out.phones.length, call_pages: out.pages.length }, null, 2));
}
