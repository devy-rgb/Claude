#!/usr/bin/env node
/* clean-ads.mjs — find the ads in a run that carry NO pricing, NO government /
 * program framing and NOTHING that implies "free".
 *
 * Checks every on-niche creative family (clones collapsed by chash) across
 * every surface we have: headline, body, link caption, CTA, landing URL, page
 * name, voiceover transcript, and on-screen text (hook-frame OCR, full-video
 * OCR from _ocr_full/, static-image OCR). A creative is:
 *   clean       no hard and no soft match anywhere
 *   borderline  soft matches only (e.g. "affordable", "specials", "benefits")
 *   excluded    at least one hard match (reason, field and snippet recorded)
 *   off-vertical  passes, but isn't about remodeling (supplements, cat litter)
 *   unreadable  DCO with template placeholders — no copy to judge
 * A human call in <run>/clean-ads/review.json always wins:
 *   { "<hash>": { "verdict": "clean|borderline|excluded|off-vertical", "why": "..." } }
 *   { "<hash>": { "ignore": ["on-screen:dollar amount"], "why": "OCR misread" } }   drop a false hit, re-derive status
 *
 * --free-estimates ok   "free" is allowed when it only describes the sales step (free estimate,
 *                       quote, consultation, inspection, design consult). A free product, install,
 *                       upgrade, giveaway or $0 still excludes. Allowed hits are kept with sev "allowed".
 *
 * --also-raw <file> --also-date <YYYY-MM-DD>   merge an earlier harvest (e.g. last week's full library into
 *                       a new-launches run). Its ads age as of --also-date; ads in this run's raw/ count as new.
 *
 * Usage: node clean-ads.mjs --niche bathroom-remodeling --date 2026-09-13 [--root <path>] [--free-estimates ok]
 * Writes <run>/clean-ads/clean-ads.json.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn, chash, PLACEHOLDER } from './lib.mjs';

const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'bathroom-remodeling';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const STORE = argv.store || path.join(ROOT, NICHE);   // --store: media store when the run lives in a scratch root
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const OUT = path.join(RUN, 'clean-ads');
fs.mkdirSync(OUT, { recursive: true });
const ALLOW_FREE_ESTIMATE = !!argv['free-estimates'];
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const rt = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ---------------- rules ----------------
 * [regex, label]. HARD = excluded. SOFT = borderline. Case-insensitive unless noted. */
const PRICE_HARD = [
  [/\$\s?\d/, 'dollar amount'],
  [/\b\d[\d,.]*\s?(dollars?|bucks)\b|\b(hundreds|thousands) of dollars\b/i, 'dollar amount'],
  [/\d\s?%\s*(off|discount|apr|interest|financing|savings?|less|lower|cheaper)\b|%\s*off\b/i, 'percent discount'],
  [/\bhalf[- ](off|price)\b|\bbuy one,? get one\b|\bbogo\b/i, 'discount'],
  [/\b(price|prices|priced|pricing|pricetag|price-tag)\b/i, 'price'],
  [/\b(cost|costs|costing)\b(?!\s+you\s+(later|down the road|in the long run))|\bcostly\b(?!\s+(mistakes?|errors?|repairs?|damage|problems?))/i, 'cost'],
  [/\b(discount|discounts|discounted|coupon|coupons|rebate|rebates|clearance|liquidat\w*|wholesale|markdown|marked down|sale|sales event)\b/i, 'discount / sale'],
  [/\b(financ(e|es|ed|ing)|payment plans?|monthly payments?|low payments?|easy payments?|no payments?|no interest|interest[- ]free|0\s?% interest|per month|\/\s?mo\b|\/month\b|money down|down payment)\b/i, 'financing / payments'],
  [/\bAPR\b|\d\s?%\s?[Aa][Pp][Rr]\b/, 'financing / payments'],  // case-sensitive: OCR noise reads as 'apr'
  [/\b(save|saves|saving)\s+(up to|over|thousands|hundreds|big|huge|\$|\d)|\bsavings\b/i, 'savings'],
  [/\b(cheap|cheaper|cheapest|inexpensive|bargain|overpay\w*|overpriced|rip[- ]?off)\b/i, 'cheap / overpay'],
  [/\b(specials|special offers?|special (promotion|pricing|savings|event)|limited[- ]time offers?|exclusive offers?|offer ends|current offers?|promo|promos|promotion|promotions|promotional|oferta)\b/i, 'offer / promotion'],
  [/\bhow much (is|are|does|do|will|would|should|could) (a|an|the|it|your|my|this|that)\b/i, 'how much'],
  [/\bsave on\b|\b(how )?(you|homeowners) (can|could|will|'ll) save\b|\bcan save\b|\b(limited[- ]time|big|huge) savings?\b/i, 'savings'],
  [/\b(flexible|affordable|convenient) payments?\b|\bpayment options?\b|\bbreak the bank\b|\bdown to the penny\b|\bmore affordable than\b|\bless expensive than\b|\blowest (price|cost)s?\b/i, 'financing / price claim'],
  [/\b(precio|precios|costo|costos|descuento|descuentos|financiamiento|ahorr[aeo]\w*)\b/i, 'price (es)'],
];
const PRICE_SOFT = [
  [/\b(afford|affordable|affordably|affordability)\b/i, 'affordable'],
  [/\bbudgets?\b/i, 'budget'],
  [/\bhidden fees\b|\bfactory[- ]direct\b/i, 'fees / factory-direct'],
  [/\b(quote|price|estimate)s? (is |are )?(good|locked|guaranteed|valid) for\b|\bprice[- ]lock/i, 'price lock'],
  [/\b(deal|deals)\b(?! with)/i, 'deal'],
  [/\b(invest|investment|value|expensive|pay|paying|paid|money|spend|spending|fixed income)\b/i, 'money word'],
  [/\bcostly\s+(mistakes?|errors?|repairs?|damage|problems?)\b|\bcost(s)? you\s+(later|down the road|in the long run)\b/i, 'figurative cost'],
];
const GOV_HARD = [
  [/\b(government|gov|govt|gov't|federal|federally|stimulus|legislation|lawmakers|congress|white house|the administration|new law)\b/i, 'government'],
  [/\b(medicare|medicaid|social security|veterans? affairs|obamacare|inflation reduction act|tax credits?|energy credits?|tax (break|deduction|incentive)s?)\b/i, 'named agency / benefit'],
  [/\b(SSA|SSI|SSDI|HUD|FHA|USDA|FEMA|IRS)\b|\bthe VA\b|\bVA (benefit|program|approved|funding|disability|loan)s?\b/, 'named agency'],
  [/\b(program|programs|programme|initiative|initiatives)\b/i, 'program / initiative'],
  [/\b(grant|grants|subsid(y|ies|ized|ised)|unclaimed|funding|funded|entitled|entitlement|allowance|voucher)\b/i, 'grant / funding / entitlement'],
  [/\b(senior|seniors|homeowner|homeowners|veteran|veterans|resident|residents|disability|disabled|low[- ]income|elderly|retiree|retirees)'?\s+(relief|assistance|aid|benefits?|funding|grants?|rebates?)\b/i, 'relief / assistance'],
  [/\b(relief|assistance) (fund|funds|service|services|benefit|benefits)\b/i, 'relief / assistance'],
  [/\bqualif(y|ies|ied|ying|ication)\b(?!\s+(installer|installers|pro|pros|professional|professionals|technician|technicians|contractor|contractors|team|teams|expert|experts|staff|craftsmen|designer|designers|crew|crews|consultant|consultants))|\b(eligible|eligibility|ineligible)\b/i, 'qualify / eligibility'],
  [/\bborn (before|between|after|in) (19|20)\d\d\b|\bborn (before|between)\b|\battention seniors?\b/i, 'born-before gate / senior call-out'],
  [/\b(u\.?s\.?|american|us) (residents?|citizens?)\b/i, 'US-resident gate'],
  [/\b(officials? (announced|confirmed|say)|just (announced|released) (a|the)|announced (a|the) new|president (trump|biden)|trump|biden)\b/i, 'official announcement'],
  [/\b(benefits? (for|available to|reserved|made specifically|program))\b/i, 'benefit framing'],
];
const GOV_SOFT = [
  [/\b(benefit|benefits|assistance|relief|approved|approval|claim|claims|residents?)\b/i, 'benefit / relief word'],
  [/🇺🇸/u, 'US flag emoji'],
  [/\b(seniors?|homeowners?) (over|aged?|age) \d\d\b|\bover (the age of )?\d\d\b/i, 'age gate'],
];
// "free" is excluded only when it isn't part of a compound like hassle-free or freestanding
const FREE_COMPOUND = /(hassle|worry|maintenance|stress|mold|mildew|grout|clutter|slip|leak|pain|risk|barrier|step|tile|chemical|bpa|toll|hands|trouble|headache|mess|dust|seam|scratch|stain|rust|lead|obligation|pressure|commitment|allergen|germ|smoke|lint|error|damage|rot|crack|fade|chip|water|threshold|curb|glue|caulk|hazard|fall|trip|clog|pest|bacteria|toxin|voc|fuss|latex|drip|splash|odor|debt|duty|tax|stair|cord|key|touch|interest|fee|grab|guess|care|scent|fragrance|pvc|phthalate|formaldehyde|residue|streak|tool|mortar|joint|lip|ledge|mould|flake|frizz|itch|scald|shock|grease|soap|scum|spot)[\s-]*$/i;
function freeMatches(t) {
  const out = [];
  for (const m of t.matchAll(/\bfree\b/gi)) {
    const pre = t.slice(Math.max(0, m.index - 25), m.index), post = t.slice(m.index + 4, m.index + 14);
    if (FREE_COMPOUND.test(pre)) continue;
    if (/feel\s*$/i.test(pre)) continue;
    if (/^[\s-]*(standing|flowing|form|up\b|time\b|spirit|dom)/i.test(post)) continue;
    out.push(m);
  }
  return out;
}
const FREE_HARD = [
  [/\$\s?0(?![\d,.])|\b(zero|0) (dollars|cost|out[- ]of[- ]pocket|down)\b/i, '$0'],
  [/\bno[- ](cost|charge|out[- ]of[- ]pocket|upfront (cost|payment)s?)\b|\bat no (cost|charge|expense)\b|\bout[- ]of[- ]pocket\b|\bnothing out of pocket\b/i, 'no cost / out of pocket'],
  [/\b(complimentary|on the house|gratis|sin costo)\b|\b(is|it'?s|are|'re) on us\b/i, 'complimentary'],
  [/\b(won'?t|doesn'?t|does not|will not|didn'?t|did not) (cost|pay)\b|\bpay(ing)? nothing\b|\bwithout paying\b|\ba (dime|penny)\b/i, "won't cost you"],
  [/\b(paid for|pays for|covered by|fully covered|cover(s|ed)? the (cost|bill|installation|remodel|expense)s?)\b/i, 'paid for / covered'],
  [/\b(giveaway|give ?away|giving away|sweepstakes|raffle|contest|win (a|your|an|this)|prize|gift cards?|free gifts?|bonus gifts?|(get|receive|claim) (a|your) gift)\b/i, 'giveaway / gift'],
];
const FREE_SOFT = [
  [/\brisk[- ]free\b|\bbonus\b/i, 'risk-free / bonus'],
  [/\b(homeowners?|families|households|seniors) needed\b|\b(test|try|tester|testers) (our|this|the) (new )?(bath|shower|service|system)/i, 'tester framing'],
];
const OCR_FREE = /\b(pree|frce|fiee|frec|freee|fre|fbee|frff)\s+(estimates?|quotes?|consult\w*|in-home|inspections?|design|install\w*)\b/i;
// "free" that only describes the sales step: free estimate / quote / consultation / inspection / design consult
const EST_WORD = '(estimates?|quotes?|quoting|consult\\w*|inspections?|assessments?|measure\\w*|bids?|design|designs|rendering|preview|evaluations?|walk-?through|appointment)';
const EST_AFTER = new RegExp(`^[\\s,.!:\\-–—]*(?:(?!(?:install\\w*|upgrades?|shipping|delivery|gifts?|kits?|labor|drain|accessor\\w*|grab|bench\\w*|month|months|year|years|days?)\\b)[\\w'&-]+[\\s,\\-–—]+){0,4}?${EST_WORD}\\b`, 'i');
const EST_BEFORE = new RegExp(`${EST_WORD}\\s+((are|is)\\s+(always\\s+|100%\\s+|completely\\s+)?)?$`, 'i');
function freeIsEstimate(h) {
  if (h.cat !== 'free' || !/"free"|no cost|complimentary|misread|free-style URL/.test(h.label)) return false;
  if (h.label === 'free-style URL') return /free-?(estimate|quote|consult)/i.test(h.match);
  if (/estimates?|quotes?|consult/i.test(h.match)) return true;
  if (h.pre == null) return false;
  return EST_AFTER.test(h.post.replace(/\s+/g, ' ')) || EST_BEFORE.test(h.pre.replace(/\s+/g, ' '));
}
const META_PRICE = /price|cost|discount|deal|saving|\bsave|sale\b|coupon|offer|payless|cheap|afford|financ|promo/i;
const META_GOV = /program|relief|grant|assist|benefit|stimulus|\.gov\b|govt|federal|initiative|subsid|rebate|senior-?aid|entitle/i;
const META_FREE = /free(?!standing)|nocost|no-cost|zerocost|giveaway/i;
const REMODEL = /remodel|renovat|makeover|conver(t|sion)|install|replac|upgrade|refinish|reglaz|resurfac|re-?bath|bath ?fitter|walk-?in|tub[- ]to[- ]shower|shower system|bath system|surround|liner|vanity|tiles?\b|contractor|transform|new (bath|bathroom|shower|tub)|dream bath|one[- ]day|grab bar|bathroom design|showroom|jacuzzi|kohler|american standard|west shore|bath planet|luxury bath|five star bath|safe step/i;

/* ---------------- load ---------------- */
const CFG = loadNiche(NICHE);
const isRelevant = relevanceFn(CFG);
const ads = new Map();
for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
  for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, Object.assign(a, { _new: true }));
if (argv['also-raw']) {
  const alsoNow = Math.floor(Date.parse((argv['also-date'] || DATE) + 'T12:00:00Z') / 1000);
  for (const a of (rd(argv['also-raw'].replace(/^~/, os.homedir()), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, Object.assign(a, { _now: alsoNow }));
}
const A = rd(path.join(RUN, 'analysis.json'), { pages: [] });
const bucketOf = Object.fromEntries(A.pages.map(p => [p.pid, p.bucket]));
const REVIEW = rd(path.join(OUT, 'review.json'), {});
const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

const fam = new Map(); let unreadable = 0; const unreadablePages = {};
for (const a of ads.values()) {
  if (!isRelevant(a)) continue;
  if (PLACEHOLDER.test(a.body || '') || PLACEHOLDER.test(a.title || '')) { unreadable++; unreadablePages[a.page] = (unreadablePages[a.page] || 0) + 1; continue; }
  const h = chash(a);
  const now = a._now || NOW;
  const life = Math.max(0, ((a.act ? now : (a.end || now)) - (a.start || now)) / 86400);
  const f = fam.get(h) || { hash: h, ads: [], n_new: 0, pages: new Map(), coll: 0, life: 0, rep: null, repLife: 0,
    bodies: new Set(), titles: new Set(), caps: new Set(), urls: new Set(), ctas: new Set(), vid: false, img: false, fmt: a.fmt };
  f.ads.push(a.id); if (a._new) f.n_new++; f.coll += a.coll || 1; f.life = Math.max(f.life, life);
  const pg = f.pages.get(a.pid) || { pid: a.pid, page: a.page, bucket: bucketOf[a.pid] || 'unclassified', ads: 0 };
  pg.ads++; f.pages.set(a.pid, pg);
  if (a.body) f.bodies.add(a.body); if (a.title) f.titles.add(a.title); if (a.cap) f.caps.add(a.cap);
  if (a.url) f.urls.add(a.url); if (a.cta) f.ctas.add(a.cta);
  if (a.vid) f.vid = true; if (a.img) f.img = true;
  if (!f.rep || (a.coll || 1) > (f.rep.coll || 1) || ((a.coll || 1) === (f.rep.coll || 1) && life > f.repLife)) { f.rep = a; f.repLife = life; }
  fam.set(h, f);
}

const nk = s => (s == null ? s : String(s).normalize('NFKC'));
const ocrClean = s => nk(s || '').split('\n').map(l => l.trim()).filter(l => l.replace(/[^a-z0-9$%]/gi, '').length >= 3).join('\n');
function scan(text, rules, sev, cat, field, hits) {
  if (!text) return;
  for (const [re, label] of rules) {
    const m = text.match(re);
    if (m) hits.push({ cat, sev, field, label, match: m[0], snippet: text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60).replace(/\s+/g, ' ').trim(),
      pre: text.slice(Math.max(0, m.index - 60), m.index), post: text.slice(m.index + m[0].length, m.index + m[0].length + 60) });
  }
}

const rows = [];
for (const f of fam.values()) {
  const hasStore = fs.existsSync(path.join(STORE, '_creatives', f.hash + '.mp4')) || fs.existsSync(path.join(STORE, '_creatives', f.hash + '.jpg'));
  const kind = fs.existsSync(path.join(STORE, '_creatives', f.hash + '.mp4')) ? 'video'
    : fs.existsSync(path.join(STORE, '_creatives', f.hash + '.jpg')) ? 'image' : 'copy-only';
  const transcript = nk(rt(path.join(STORE, '_transcripts_full', f.hash + '.txt')) ?? rt(path.join(STORE, '_transcripts', f.hash + '.txt')));
  const ocrHook = ocrClean(rt(path.join(STORE, '_ocr', f.hash + '.txt')));
  const ocrFullRaw = rt(path.join(STORE, '_ocr_full', f.hash + '.txt'));
  const ocrFull = ocrClean(ocrFullRaw);
  const media_checked = kind === 'copy-only' ? 'copy only (no media captured)'
    : kind === 'image' ? (ocrHook !== '' || rt(path.join(STORE, '_ocr', f.hash + '.txt')) !== null ? 'copy + image text' : 'copy only (image not OCR\'d)')
    : `copy + voiceover${transcript === null ? ' (missing)' : ''} + on-screen text (${ocrFullRaw !== null ? 'full video' : 'first 3s only'})`;
  const copy = nk([...f.titles, ...f.bodies, ...f.caps].join('\n'));
  const screen = [ocrHook, ocrFull].filter(Boolean).join('\n');
  const meta = nk([...[...f.pages.values()].map(p => p.page), ...[...f.urls]].join('\n'));
  const hits = [];
  for (const [field, text] of [['copy', copy], ['voiceover', transcript], ['on-screen', screen]]) {
    scan(text, PRICE_HARD, 'hard', 'pricing', field, hits); scan(text, PRICE_SOFT, 'soft', 'pricing', field, hits);
    scan(text, GOV_HARD, 'hard', 'government', field, hits); scan(text, GOV_SOFT, 'soft', 'government', field, hits);
    scan(text, FREE_HARD, 'hard', 'free', field, hits); scan(text, FREE_SOFT, 'soft', 'free', field, hits);
    if (text) for (const m of freeMatches(text)) hits.push({ cat: 'free', sev: 'hard', field, label: '"free"', match: m[0],
      snippet: text.slice(Math.max(0, m.index - 60), m.index + 64).replace(/\s+/g, ' ').trim(),
      pre: text.slice(Math.max(0, m.index - 60), m.index), post: text.slice(m.index + m[0].length, m.index + m[0].length + 60) });
  }
  const om = screen && screen.match(OCR_FREE);
  if (om) hits.push({ cat: 'free', sev: 'hard', field: 'on-screen', label: '"free" (OCR misread)', match: om[0], snippet: om[0] });
  for (const c of f.ctas) if (/\boffer\b/i.test(c)) hits.push({ cat: 'pricing', sev: 'soft', field: 'CTA button', label: 'offer CTA', match: c, snippet: c });
  for (const p of f.pages.values()) if (META_PRICE.test(p.page)) hits.push({ cat: 'pricing', sev: 'hard', field: 'page name', label: 'price-style page name', match: p.page, snippet: p.page });
  for (const p of f.pages.values()) if (META_GOV.test(p.page)) hits.push({ cat: 'government', sev: 'hard', field: 'page name', label: 'program-style page name', match: p.page, snippet: p.page });
  for (const u of f.urls) {
    let hp = ''; try { const x = new URL(u); hp = x.hostname + x.pathname; } catch { hp = u; }
    if (META_GOV.test(hp)) hits.push({ cat: 'government', sev: 'hard', field: 'landing URL', label: 'program-style URL', match: hp, snippet: hp });
    if (META_PRICE.test(hp)) hits.push({ cat: 'pricing', sev: 'hard', field: 'landing URL', label: 'price-style URL', match: hp, snippet: hp });
    if (META_FREE.test(hp)) hits.push({ cat: 'free', sev: 'hard', field: 'landing URL', label: 'free-style URL', match: hp, snippet: hp });
  }
  // de-dupe identical label+field
  if (ALLOW_FREE_ESTIMATE) for (const h of hits) if (h.sev === 'hard' && freeIsEstimate(h)) { h.sev = 'allowed'; h.label = 'free estimate/quote (allowed)'; }
  for (const h of hits) { delete h.pre; delete h.post; }
  const rv = REVIEW[f.hash];
  const ignore = new Set((rv && rv.ignore) || []);
  const seen = new Set(); const H = hits.filter(h => { const k = h.cat + h.sev + h.field + h.label; if (seen.has(k) || ignore.has(h.field + ':' + h.label)) return false; seen.add(k); return true; });
  const hard = H.filter(h => h.sev === 'hard'), soft = H.filter(h => h.sev === 'soft');
  const allText = [copy, transcript, screen, meta].filter(Boolean).join('\n');
  let status = hard.length ? 'excluded' : soft.length ? 'borderline' : 'clean';
  if (status !== 'excluded' && !REMODEL.test(allText)) status = 'off-vertical';
  const auto = status;
  if (rv && rv.verdict) status = rv.verdict;
  const pages = [...f.pages.values()].sort((x, y) => y.ads - x.ads);
  const a = f.rep;
  rows.push({
    hash: f.hash, status, auto_status: auto, review: rv || null, bracket: (rv && rv.bracket) || null, kind, fmt: a.fmt, media_checked,
    bucket: pages[0].bucket, page: a.page, pid: a.pid, pages, n_pages: pages.length,
    n_ads: f.ads.length, n_new: argv['also-raw'] ? f.n_new : null, coll: f.coll, life: Math.round(f.life), rep_life: Math.round(f.repLife),
    started: a.start ? new Date(a.start * 1000).toISOString().slice(0, 10) : null,
    id: a.id, link: `https://www.facebook.com/ads/library/?id=${a.id}`, ad_ids: f.ads,
    title: a.title || '', body: a.body || '', cta: a.cta || null, url: a.url || null,
    domains: [...new Set([...f.urls].map(domain).filter(Boolean))],
    copy_hook: (a.body || '').split('\n').map(s => s.trim()).find(Boolean) || a.title || '',
    voice_hook: transcript ? (transcript.replace(/\s+/g, ' ').trim().match(/^.{0,160}?[.?!](\s|$)/) || [transcript.replace(/\s+/g, ' ').trim().slice(0, 160)])[0].trim() : null,
    screen_hook: ocrHook ? ocrHook.split('\n').slice(0, 3).join(' / ') : null,
    transcript: transcript ? transcript.replace(/\s+/g, ' ').trim() : null,
    ocr: screen || null,
    thumb_file: kind === 'image' ? `_creatives/${f.hash}.jpg` : kind === 'video' ? `_frames/${f.hash}-t1.5.jpg` : null,
    reasons: H,
  });
}
rows.sort((x, y) => ({ clean: 0, borderline: 1, 'off-vertical': 2, excluded: 3 }[x.status] ?? 4) - ({ clean: 0, borderline: 1, 'off-vertical': 2, excluded: 3 }[y.status] ?? 4)
  || y.life - x.life || y.n_ads - x.n_ads);

/* ---------------- summary ---------------- */
const by = (k, list = rows) => list.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {});
const excl = rows.filter(r => r.status === 'excluded');
const cats = { pricing: 0, government: 0, free: 0 }; const only = { pricing: 0, government: 0, free: 0 }; const combos = {};
for (const r of excl) {
  const cs = [...new Set(r.reasons.filter(h => h.sev === 'hard').map(h => h.cat))].sort();
  cs.forEach(c => cats[c]++); if (cs.length === 1) only[cs[0]]++;
  combos[cs.join(' + ')] = (combos[cs.join(' + ')] || 0) + 1;
}
const labelCount = {};
for (const r of excl) for (const l of new Set(r.reasons.filter(h => h.sev === 'hard').map(h => h.cat + ': ' + h.label))) labelCount[l] = (labelCount[l] || 0) + 1;
const sole = {}; // creatives excluded by exactly one hard label — the near-misses
for (const r of excl) { const ls = [...new Set(r.reasons.filter(h => h.sev === 'hard').map(h => h.cat + ': ' + h.label))]; if (ls.length === 1) sole[ls[0]] = (sole[ls[0]] || 0) + 1; }
const summary = {
  niche: NICHE, date: DATE, free_estimates_allowed: ALLOW_FREE_ESTIMATE, ads_on_niche: [...fam.values()].reduce((s, f) => s + f.ads.length, 0) + unreadable,
  creatives: rows.length, unreadable_dco_ads: unreadable, unreadable_pages: unreadablePages,
  status: by('status'), clean_by_bucket: by('bucket', rows.filter(r => r.status === 'clean')),
  clean_ads: rows.filter(r => r.status === 'clean').reduce((s, r) => s + r.n_ads, 0),
  excluded_by_category: cats, excluded_by_one_category_only: only, excluded_combos: combos,
  excluded_by_label: Object.fromEntries(Object.entries(labelCount).sort((a, b) => b[1] - a[1])),
  excluded_by_single_label: Object.fromEntries(Object.entries(sole).sort((a, b) => b[1] - a[1])),
  media_checked: by('media_checked'),
};
fs.writeFileSync(path.join(OUT, 'clean-ads.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 2));
