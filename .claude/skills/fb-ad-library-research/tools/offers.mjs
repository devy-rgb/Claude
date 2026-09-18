#!/usr/bin/env node
/* ACA pay-per-call OFFERS — the dataset the call-offer report and PDF are built on.
 *
 * An ad is a CALL OFFER when all three hold:
 *  1. ACA-explicit: the ACA / Obamacare / the marketplace / premium tax credits or subsidies for
 *     coverage / a state exchange is named in its copy, title, link description, voiceover or
 *     on-screen text (config `offers.aca`, `offers.aca_cs`).
 *  2. Not a Medicare-only ad and not a pitch AGAINST the ACA (private PPO, health share,
 *     "cheaper than ACA plans") — `offers.medicare`, `offers.alt`.
 *  3. Its conversion is an inbound phone call: Meta Call Now button, a call CTA, a phone number
 *     in the ad, a tel: link, or a landing page verified as a call lander (landers.json, class
 *     `call`; a `mixed` call+form lander counts only when the ad itself asks for the call).
 * Everything else ACA is lead gen (form, survey, chat, booking, native lead form) and is only
 * counted, never ranked.
 *
 * Reads raw/*.json, analysis.json, scored.json, scripts.json, _ocr/, landers.json, angles.json.
 * Writes offers.json and offers.md (tables to lift into REPORT.md).
 *   node offers.mjs --niche aca-pay-per-call --date 2026-09-15
 * Owned by the ACA pay-per-call session; run after run.sh --media and landers.mjs.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, chash, rx } from './lib.mjs';
const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); args[k] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; } }
const NICHE = args.niche || 'aca-pay-per-call', DATE = args.date || new Date().toISOString().slice(0, 10);
const ROOT = args.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE), RUN = path.join(BASE, '_reports', DATE);
const CFG = loadNiche(NICHE), O = CFG.offers || {}, CS = CFG.call_signals || {};
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);

const ACA = rx(O.aca), ACA_CS = O.aca_cs ? new RegExp(O.aca_cs) : null, ALT = rx(O.alt), MED = new RegExp(O.medicare, 'gi');
const CALL_ASK = rx(O.call_ask), ANTI = CS.anti_regex ? rx(CS.anti_regex) : null;
const PHONE_G = new RegExp(CS.phone_regex, 'g'), CTA_TEXT = rx(CS.cta_text), CTA_TYPES = new Set(CS.cta_types || []);
const HARD = new Set([...(CS.hard || ['cta:CALL_NOW', 'cta:call-text', 'phone-in-copy', 'tel-link', 'lander:call']), 'lander:call-tracking']);
const NOT_OFFER_PAGE = O.exclude_pages ? rx(O.exclude_pages) : null;   // official exchanges / government: ACA, but not an offer anyone buys
const isAca = t => !!t && (ACA.test(t) || !!(ACA_CS && ACA_CS.test(t)));
const digits = s => { const d = String(s || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? d : null; };
const urlKey = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, ''); } catch { return null; } };
const VI = /[ăđơư]|[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const ES_WORDS = /\b(de|la|el|tu|su|para|con|que|los|las|del|por|una|seguro|salud|cobertura|planes|gratis|m[eé]dico|familia|ahora|aplicar|califica|ingresos|permiso|trabajo|cr[eé]dito)\b/gi;
const ES_STRONG = /\b(seguro|salud|cobertura|gratis|ll[aá]manos|ll[aá]ma|m[eé]dico|familia|ahora|califica|obt[eé]n|cotiza|protege)\b|[¿¡ñ]/i;
const HT = /\b(asirans|ou pa|se yon|pou ou|fanmi|kijan|lajan)\b/i;
const langOf = t => VI.test(t) ? 'Vietnamese' : (ES_STRONG.test(t) && (t.match(ES_WORDS) || []).length >= 5) ? 'Spanish' : /[ঀ-৿]/.test(t) ? 'Bengali' : HT.test(t) ? 'Haitian Creole' : 'English';
// DCO / catalog ads render their body as a template ({{product.brand}}); their real copy lives on the cards
const PLACEHOLDER = /\{\{[^}]+\}\}/;
const firstLine = a => { const b = (a.body || '').split('\n').map(s => s.trim()).find(Boolean) || '';
  if (b && !PLACEHOLDER.test(b)) return b;
  const c = (a.cards || []).find(c => (c.t && !PLACEHOLDER.test(c.t)) || (c.b && !PLACEHOLDER.test(c.b)));
  return c ? [c.t, c.b].filter(x => x && !PLACEHOLDER.test(x)).join(' — ') : (a.title && !PLACEHOLDER.test(a.title) ? a.title : '(dynamic catalog ad — no fixed copy)'); };
const lifeOf = a => Math.max(0, ((a.act ? NOW : (a.end || NOW)) - (a.start || NOW)) / 86400);

const ads = new Map();
for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
  for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
const A = rd(path.join(RUN, 'analysis.json'), { pages: [] }), bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
const S = rd(path.join(RUN, 'scored.json'), []), byHash = Object.fromEntries(S.map(x => [x.hash, x]));
const K = rd(path.join(RUN, 'scripts.json'), {});
const L = (rd(path.join(RUN, 'landers.json'), {}) || {}).landers || {};
const tagOf = Object.fromEntries(((rd(path.join(RUN, 'angles.json'), {}) || {}).rows || []).map(r => [r.id, r]));
const ocrOf = h => { try { return fs.readFileSync(path.join(BASE, '_ocr', h + '.txt'), 'utf8'); } catch { return ''; } };

const rows = [];
let medicareOnly = 0, altPitch = 0, govPages = 0; const removed = { alt: {}, gov: {}, medicare: {} };
const bump = (m, a) => { const k = String(a.page || '').trim(); m[k] = (m[k] || 0) + 1; };
for (const a of ads.values()) {
  const text = [a.body, a.title, a.ldesc, a.cap, ...((a.cards || []).map(c => `${c.t || ''} ${c.b || ''}`))].filter(Boolean).join('\n');
  const hash = chash(a), k = K[hash] || {}, voice = k.text || '', screen = `${(k.screen_hook || []).join(' ')} ${ocrOf(hash)}`;
  const acaWhere = isAca(text) ? 'copy' : isAca(voice) ? 'voiceover' : isAca(screen) ? 'on-screen text' : null;
  if (!acaWhere) continue;
  if (MED.test(text) && !isAca(text.replace(MED, ' '))) { medicareOnly++; bump(removed.medicare, a); MED.lastIndex = 0; continue; }
  MED.lastIndex = 0;
  if (ALT.test(text)) { altPitch++; bump(removed.alt, a); continue; }
  if (NOT_OFFER_PAGE && NOT_OFFER_PAGE.test(String(a.page || '').trim())) { govPages++; bump(removed.gov, a); continue; }
  const sig = [];
  if ((a.ctat && CTA_TYPES.has(a.ctat)) || (a.cards || []).some(c => c.ctat && CTA_TYPES.has(c.ctat))) sig.push('cta:CALL_NOW');
  else if (a.cta && CTA_TEXT.test(a.cta.trim())) sig.push('cta:call-text');
  const copyPhones = [...new Set((text.match(PHONE_G) || []).map(digits).filter(Boolean))];
  if (copyPhones.length) sig.push('phone-in-copy');
  const tels = [a.url, ...(a.xlinks || []), ...((a.cards || []).map(c => c.u))].filter(u => /^tel:/i.test(String(u || ''))).map(u => digits(String(u).replace(/^tel:/i, ''))).filter(Boolean);
  if (tels.length) sig.push('tel-link');
  const lk = a.url && !/^tel:/i.test(a.url) ? urlKey(a.url) : null, lander = lk ? L[lk] : null;
  if (lander && lander.class === 'call') sig.push('lander:call');
  if (lander && lander.class === 'mixed') sig.push('lander:call+form');
  // a call-tracking script (Ringba, Retreaver, Invoca…) on the lander means the funnel is monetised per call,
  // even when a short quiz comes first — the classic quiz-to-call pay-per-call funnel
  if (lander && (lander.vendors || []).length && lander.class !== 'blocked') sig.push('lander:call-tracking');
  const callAsk = CALL_ASK.test(text) || CALL_ASK.test(voice);
  const hard = sig.filter(s => HARD.has(s));
  const offer = hard.length > 0 || (sig.includes('lander:call+form') && callAsk);
  const leadPath = offer ? null
    : (a.ctat === 'WHATSAPP_MESSAGE' || (lander && lander.class === 'chat')) ? 'WhatsApp / chat'
    : (a.ctat === 'MESSAGE_PAGE' || (lander && lander.class === 'native' && /message/i.test(a.cta || ''))) ? 'Messenger'
    : (lander && (lander.class === 'form' || lander.class === 'mixed')) ? 'form / survey / booking'
    : (lander && lander.class === 'site') ? 'website, no call path'
    : (lander && lander.class === 'native') || !a.url ? 'Facebook-native (lead form, page or profile)'
    : 'landing page not readable';
  rows.push({ id: a.id, pid: a.pid, page: String(a.page || '').trim(), bucket: bucketOf[a.pid] || 'unclassified', act: a.act, start: a.start, life: +lifeOf(a).toFixed(1),
    coll: a.coll || 1, fmt: a.fmt, cta: a.cta, ctat: a.ctat, url: a.url, hash, aca: acaWhere, anti: !!(ANTI && ANTI.test(text)), signals: sig, hard, callAsk, offer, lead_path: leadPath,
    phones: [...new Set([...copyPhones, ...tels, ...(offer && lander && lander.tel ? lander.tel : [])])],
    lander: lander ? { key: lk, class: lander.class, final: lander.final_host || null, vendors: lander.vendors || [], title: lander.title || '' } : null,
    lang: langOf(`${text} ${voice}`), hook: firstLine(a), dco: PLACEHOLDER.test(a.body || ''), title: a.title || '', likes: a.likes, cat: a.cat || [], prof: a.prof || null, src: a.src,
    link: `https://www.facebook.com/ads/library/?id=${a.id}` });
}
const offers = rows.filter(r => r.offer), lead = rows.filter(r => !r.offer);
const ev = x => (x.coll || 1) * Math.min(x.life, 120);

// creatives
const fam = new Map();
// catalog (DCO) ads all normalise to the same template body, so group them by page + card copy instead of by hash
const famKey = r => r.dco ? `dco:${r.pid}:${String(r.hook).toLowerCase().replace(/\s+/g, ' ').slice(0, 120)}` : r.hash;
for (const r of offers) { const k = famKey(r); const f = fam.get(k) || { hash: r.hash, key: k, ads: [], pages: new Set() }; f.ads.push(r); f.pages.add(r.page); fam.set(k, f); }
const creatives = [...fam.values()].map(f => {
  const rep = f.ads.slice().sort((x, y) => (y.coll - x.coll) || (y.life - x.life))[0], sc = byHash[f.hash] || {}, k = K[f.hash] || {};
  return { hash: f.hash, key: f.key, id: rep.id, pid: rep.pid, page: rep.page, bucket: rep.bucket, kind: sc.kind || (rep.fmt === 'VIDEO' ? 'video' : 'image'),
    ads: f.ads.length, active: f.ads.filter(r => r.act).length, family_coll: f.ads.reduce((s, r) => s + r.coll, 0), pages: [...f.pages], life: Math.max(...f.ads.map(r => r.life)),
    signals: [...new Set(f.ads.flatMap(r => r.signals))], phones: [...new Set(f.ads.flatMap(r => r.phones))], cta: rep.cta, ctat: rep.ctat, url: rep.url, lander: rep.lander,
    aca: rep.aca, anti: f.ads.some(r => r.anti), lang: rep.lang, copy_hook: rep.hook, title: PLACEHOLDER.test(rep.title || '') ? '' : rep.title, body: PLACEHOLDER.test((ads.get(rep.id) || {}).body || '') ? rep.hook : ((ads.get(rep.id) || {}).body || ''), dco: PLACEHOLDER.test((ads.get(rep.id) || {}).body || ''),
    voice: !!k.voice, spoken_hook: k.voice ? k.spoken_hook : null, spoken_hook_2: k.voice ? k.spoken_hook_2 : null, screen_hook: (k.screen_hook || []).slice(0, 3), script: k.voice ? k.text : '',
    score: sc.score ?? null, rvert: sc.rvert || null, devices: sc.devices || [], aggression: sc.aggression || 0, urgency: sc.urgency || 1,
    angles: (tagOf[rep.id] || {}).angles || [], triggers: (tagOf[rep.id] || {}).triggers || [], link: rep.link };
}).sort((x, y) => (y.family_coll * Math.min(y.life, 120)) - (x.family_coll * Math.min(x.life, 120)));

// pages
const pm = new Map();
for (const r of offers) { const p = pm.get(r.pid) || { pid: r.pid, page: r.page, bucket: r.bucket, likes: r.likes, cat: r.cat, prof: r.prof, ads: [] }; p.ads.push(r); pm.set(r.pid, p); }
const pageAllAca = pid => rows.filter(r => r.pid === pid).length;
const pages = [...pm.values()].map(p => {
  const l = p.ads, lives = l.map(r => r.life).sort((a, b) => a - b), cnt = f => l.reduce((m, r) => { for (const v of [].concat(f(r))) if (v) m[v] = (m[v] || 0) + 1; return m; }, {});
  return { pid: p.pid, page: p.page, bucket: p.bucket, likes: p.likes ?? null, category: (p.cat || []).join(', '), profile: p.prof || `https://www.facebook.com/${p.pid}`,
    library: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${p.pid}&search_type=page&media_type=all`,
    offer_ads: l.length, aca_ads: pageAllAca(p.pid), active: l.filter(r => r.act).length, creatives: new Set(l.map(r => r.hash)).size, dup: l.reduce((s, r) => s + r.coll, 0),
    median_life: Math.round(lives[Math.floor(lives.length / 2)] || 0), oldest: Math.round(lives[lives.length - 1] || 0), newest: Math.round(lives[0] || 0),
    phones: [...new Set(l.flatMap(r => r.phones))], signals: cnt(r => r.hard), langs: cnt(r => r.lang), ctas: cnt(r => r.cta || 'no button'),
    lander_hosts: [...new Set(l.map(r => r.lander && r.lander.final).filter(Boolean))], vendors: [...new Set(l.flatMap(r => (r.lander && r.lander.vendors) || []))],
    aca_where: cnt(r => r.aca), full_library: l.some(r => String(r.src || '').startsWith('page:')), sample: l.slice().sort((x, y) => ev(y) - ev(x))[0].hook.slice(0, 160),
    sample_link: l.slice().sort((x, y) => ev(y) - ev(x))[0].link };
}).sort((a, b) => (b.dup * Math.min(b.oldest, 120)) - (a.dup * Math.min(a.oldest, 120)));

// numbers
const nm = new Map();
for (const r of offers) for (const ph of r.phones) { const n = nm.get(ph) || { phone: ph, ads: 0, dup: 0, pages: new Set(), how: new Set() }; n.ads++; n.dup += r.coll; n.pages.add(r.page); r.hard.forEach(h => n.how.add(h)); nm.set(ph, n); }
const numbers = [...nm.values()].map(n => ({ phone: n.phone, toll_free: /^8(00|33|44|55|66|77|88)/.test(n.phone), ads: n.ads, dup: n.dup, pages: [...n.pages], how: [...n.how] })).sort((a, b) => b.dup - a.dup);

// shares among offers
const share = (list, f) => { const m = {}; for (const r of list) for (const v of [].concat(f(r))) if (v) m[v] = (m[v] || 0) + 1; return Object.entries(m).map(([k, v]) => ({ name: k, ads: v, share: +(v / Math.max(list.length, 1) * 100).toFixed(1) })).sort((a, b) => b.ads - a.ads); };
const tagged = offers.filter(r => tagOf[r.id]);
const BUCKETS = [['0-3d', 0, 3], ['3-7d', 3, 7], ['7-14d', 7, 14], ['14-30d', 14, 30], ['30-60d', 30, 60], ['60-90d', 60, 90], ['90d+', 90, Infinity]];
const life = list => BUCKETS.map(([n, lo, hi]) => { const l = list.filter(r => r.life >= lo && r.life < hi); return { period: n, ads: l.length, strength: l.reduce((s, r) => s + r.coll, 0) }; });
const out = {
  date: DATE, niche: NICHE,
  scope: { harvested_ads: ads.size, aca_ads: rows.length, removed_medicare_only: medicareOnly, removed_against_aca: altPitch, removed_government_exchange: govPages, call_offer_ads: offers.length, call_offer_active: offers.filter(r => r.act).length,
    call_offer_pages: pm.size, call_offer_creatives: creatives.length, lead_gen_ads: lead.length, lead_gen_paths: share(lead, r => r.lead_path), aca_where: share(offers, r => r.aca) },
  signal_mix: share(offers, r => r.hard.length ? r.hard : ['lander:call+form with call ask']), langs: share(offers, r => r.lang), buckets: share(offers, r => r.bucket),
  ctas: share(offers, r => r.cta || 'no button'), anti_call_offers: offers.filter(r => r.anti).length,
  angles: share(tagged, r => tagOf[r.id].angles), triggers: share(tagged, r => tagOf[r.id].triggers), tagged: tagged.length,
  lifespan: { all: life(offers), affiliate: life(offers.filter(r => r.bucket === 'affiliate')), branded: life(offers.filter(r => r.bucket === 'branded')) },
  vendors: share(offers.filter(r => r.lander && r.lander.vendors && r.lander.vendors.length), r => r.lander.vendors),
  landers: share(offers.filter(r => r.lander), r => `${r.lander.class} · ${r.lander.final || r.lander.key.split('/')[0]}`),
  pages, numbers, creatives, ads: offers,
  lead_gen_pages: (() => { const m = {}; for (const r of lead) { const x = m[r.page] = m[r.page] || { page: r.page, pid: r.pid, bucket: r.bucket, ads: 0, dup: 0, paths: {} }; x.ads++; x.dup += r.coll; x.paths[r.lead_path] = (x.paths[r.lead_path] || 0) + 1; }
    return Object.values(m).sort((a, b) => b.dup - a.dup).slice(0, 25); })(),
  removed_pages: Object.fromEntries(Object.entries(removed).map(([k, v]) => [k, Object.entries(v).sort((a, b) => b[1] - a[1]).slice(0, 15)])),
  rvert: (() => { const sc = creatives.filter(c => typeof c.score === 'number'); const mean = a => a.length ? +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(2) : null;
    return { scored: sc.length, mean: mean(sc.map(c => c.score)), with_devices: creatives.filter(c => (c.devices || []).length).length,
      devices: share(creatives.filter(c => (c.devices || []).length), c => c.devices), top: sc.slice().sort((a, b) => b.score - a.score).slice(0, 10).map(c => ({ page: c.page, score: c.score, devices: c.devices, life: Math.round(c.life), dup: c.family_coll, hook: c.copy_hook.slice(0, 140), link: c.link })) }; })()
};
fs.writeFileSync(path.join(RUN, 'offers.json'), JSON.stringify(out, null, 1));
const q = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const fmtPhone = d => /^\d{10}$/.test(d) ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d;
const md = [`# ACA call offers — ${NICHE} · ${DATE}`, '', '## Scope', '', '| | Ads |', '|---|---|',
  `| Harvested | ${ads.size} |`, `| ACA-explicit (copy, voiceover or on-screen) | ${rows.length + medicareOnly + altPitch + govPages} |`, `| minus Medicare-only | −${medicareOnly} |`, `| minus pitches against the ACA (private PPO, health share) | −${altPitch} |`, `| minus official exchanges and government pages | −${govPages} |`,
  `| **ACA ads** | **${rows.length}** |`, `| **Call offers** | **${offers.length}** (${pm.size} pages, ${creatives.length} creatives) |`, `| Lead gen (excluded) | ${lead.length} |`, '',
  '| Lead-gen path (excluded) | Ads |', '|---|---|', ...out.scope.lead_gen_paths.map(x => `| ${x.name} | ${x.ads} |`), '',
  '## How the call is asked for', '', '| Signal | Ads | Share |', '|---|---|---|', ...out.signal_mix.map(x => `| ${x.name} | ${x.ads} | ${x.share}% |`), '',
  '| Where the ACA is named | Ads |', '|---|---|', ...out.scope.aca_where.map(x => `| ${x.name} | ${x.ads} |`), '',
  '| Language | Ads |', '|---|---|', ...out.langs.map(x => `| ${x.name} | ${x.ads} |`), '', '| Bracket | Ads |', '|---|---|', ...out.buckets.map(x => `| ${x.name} | ${x.ads} |`), '',
  '## Pages running ACA call offers', '', '| Page | Bracket | Likes | Offer ads | All ACA ads | Active | Creatives | Dup | Oldest | Numbers | Signals | Langs | Lander | Full lib |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...pages.map(p => `| [${q(p.page)}](${p.profile}) | ${p.bucket} | ${p.likes ?? '?'} | ${p.offer_ads} | ${p.aca_ads} | ${p.active} | ${p.creatives} | x${p.dup} | ${p.oldest}d | ${p.phones.map(fmtPhone).join(', ')} | ${q(Object.entries(p.signals).map(([k, v]) => `${k} ${v}`).join(', '))} | ${q(Object.keys(p.langs).join(', '))} | ${q(p.lander_hosts.join(', '))} | ${p.full_library ? 'yes' : ''} |`), '',
  '## Numbers', '', '| Number | Toll-free | Ads | Dup | Pages | How shown |', '|---|---|---|---|---|---|', ...numbers.map(n => `| ${fmtPhone(n.phone)} | ${n.toll_free ? 'yes' : ''} | ${n.ads} | x${n.dup} | ${q(n.pages.join(', '))} | ${n.how.join(', ')} |`), '',
  '## Creatives (evidence order)', '', '| Alive | Dup | Page | Kind | Signals | Copy hook | Heard first | Link |', '|---|---|---|---|---|---|---|---|',
  ...creatives.map(c => `| ${Math.round(c.life)}d | x${c.family_coll} | ${q(c.page)} | ${c.kind} | ${q(c.signals.join('+'))} | ${q(c.copy_hook).slice(0, 110)} | ${c.voice ? q(c.spoken_hook).slice(0, 110) : (c.kind === 'video' ? '(no voiceover)' : '')} | [ad](${c.link}) |`), '',
  '## Angles among call offers', '', '| Angle | Ads | Share |', '|---|---|---|', ...out.angles.map(x => `| ${x.name} | ${x.ads} | ${x.share}% |`), '',
  '## Triggers among call offers', '', '| Trigger | Ads | Share |', '|---|---|---|', ...out.triggers.map(x => `| ${x.name} | ${x.ads} | ${x.share}% |`), '',
  '## Lifespan', '', '| Period | All | Strength | Affiliate | Branded |', '|---|---|---|---|---|', ...out.lifespan.all.map((r, i) => `| ${r.period} | ${r.ads} | ${r.strength} | ${out.lifespan.affiliate[i].ads} | ${out.lifespan.branded[i].ads} |`), '',
  '## Call tracking seen on landers', '', ...(out.vendors.length ? ['| Vendor | Ads |', '|---|---|', ...out.vendors.map(x => `| ${x.name} | ${x.ads} |`)] : ['none detected in page HTML']), '',
  '## Landers of call offers', '', '| Lander | Ads |', '|---|---|', ...out.landers.map(x => `| ${q(x.name)} | ${x.ads} |`)];
fs.writeFileSync(path.join(RUN, 'offers.md'), md.join('\n'));
console.log(JSON.stringify({ ok: true, ...out.scope, lead_gen_paths: undefined, signal_mix: out.signal_mix.slice(0, 6) }, null, 2));
