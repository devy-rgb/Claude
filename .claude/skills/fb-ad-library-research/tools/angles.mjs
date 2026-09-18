#!/usr/bin/env node
/* Tag every on-niche ad with an angle + emotional trigger, count by bracket.
   Usage: node angles.mjs --niche roofing --date 2026-09-11 [--root <path>]
   Writes <run>/angles.json and appends counts the report writer reads.
   The regexes are a first pass — the report writer still reads the copy.
   A niche config may override the taxonomy via `analysis.angles` and
   `analysis.triggers` ([[name, pattern], ...]); the built-ins below are the
   home-services (roofing) set and stay the default. */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn, copyFn, rx } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const NOW = Math.floor(Date.parse(DATE + 'T12:00:00Z') / 1000);   // run date, not the wall clock
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const CFG = loadNiche(NICHE);

const DEFAULT_ANGLES = [
  ['gov-relief-program',  /relief program|government|state[- ]funded|federal|new \d{4} (roofing|roof) (installation )?program|approved (this|the) \d{4}|stimulus|subsid|incentive program|homeowner program|national program/i],
  ['eligibility-quiz',    /see if you qualify|check (your )?eligibilit|do you qualify|enter (your )?zip|answer (a few|3|three) questions|take the quiz|qualify in|check if you qualify|calculate quote/i],
  ['price-anchor',        /usually run \$|most companies charge|\$[\d,]+ ?(to|-|–) ?\$[\d,]+|only today|pay \$[\d,]+ for that roof|for as low as \$|starting at \$|\$[\d,]+ for a roof/i],
  ['anti-overcharge',     /overpay|over-?charg|don'?t pay full price|being upsold|cut corners|rip(ped)? off|won'?t tell you|hidden (fee|cost)|inflated|markup/i],
  ['scarcity-deadline',   /deadline|ends (soon|on|this)|before (the|it)|last (chance|round|day)|limited (time|spots)|we'?re looking for \d+|only \d+ homeowners|\d+ homeowners needed|expires/i],
  ['insurance-storm',     /insurance|storm damage|hail|wind damage|claim|adjuster|carrier|act of god/i],
  ['senior-veteran',      /senior|veteran|military|retired|over 6[05]|aarp/i],
  ['free-inspection',     /free (roof )?(inspection|estimate|quote|consultation|assessment)|no (cost|obligation)/i],
  ['financing',           /financing|no money down|0% interest|monthly payment|payment plan|as low as \$\d+\/mo|72 months|affordable/i],
  ['hidden-damage',       /leak|rot|mold|attic|by the time you (see|notice)|underneath|silent|before it'?s too late|failing|damaged roof|old roof/i],
  ['local-proof',         /homeowners in|serving|local|neighborhood|county|just (finished|completed)|right here in|\bBBB\b|A\+ rating/i],
  ['contractor-expose',   /roofers? (don'?t|won'?t) want|the ugly truth|what (most )?roofing companies|industry secret|insider|they don'?t tell/i],
  ['before-after',        /before (and|&) after|transformation|curb appeal|looks brand new|worst (roof|house)/i],
  ['new-service-mechanism',/new service|this new|finally affordable|pop-?in|pop on|new way|breakthrough|just launched|new program that/i],
  ['listicle-advertorial',/here'?s what|\d+ (things|ways|reasons|questions)|we compared|guide to|read this|what you need to know/i]
];
const DEFAULT_TRIGGERS = [
  ['entitlement',      /qualify|eligib|entitled|you may be|approved|program|owed|benefit|free (roof|money)/i],
  ['loss-aversion',    /deadline|before|last chance|miss out|expires|limited|ends|only \d+|don'?t wait/i],
  ['suspicion',        /overpay|won'?t tell|upsold|rip|cut corners|truth|scam|hidden|secret|full price/i],
  ['fear-hidden-damage',/leak|rot|mold|damage|too late|failing|collapse|silent|underneath|worse/i],
  ['relief-rescue',    /no money down|we handle|no salesman|no obligation|hassle-?free|we take care|done in (a )?day|stress/i],
  ['curiosity',        /this helps|here'?s what|wondering|what (most|if)|you won'?t believe|cannot believe|hidden for this long|find out/i],
  ['social-proof',     /homeowners (in|are|have)|\d+\+? (homeowners|customers|roofs)|reviews|rated|trusted by|BBB|testimonial/i],
  ['status-anxiety',   /curb appeal|looks|neighbors|ugly|worst|embarrass|brand new/i],
  ['insider-edge',     /insider|pros use|contractors hate|don'?t want you to know|industry/i]
];
const ANGLES = ((CFG.analysis || {}).angles || DEFAULT_ANGLES).map(([n, re]) => [n, rx(re)]);
const TRIGGERS = ((CFG.analysis || {}).triggers || DEFAULT_TRIGGERS).map(([n, re]) => [n, rx(re)]);


const raw = JSON.parse(fs.readFileSync(path.join(RUN, 'raw', 'ads-01.json'), 'utf8'));
const A = JSON.parse(fs.readFileSync(path.join(RUN, 'analysis.json'), 'utf8'));
const bucketOf = {}; for (const p of A.pages) bucketOf[p.pid] = p.bucket;
const isRelevant = relevanceFn(CFG);
const isCopy = copyFn(CFG);

const rows = [];
for (const a of raw) {
  const t = `${a.body || ''} ${a.title || ''}`;
  if (!isRelevant(a) || !isCopy(a)) continue;
  const angles = ANGLES.filter(([, re]) => re.test(t)).map(([n]) => n);
  const trigs = TRIGGERS.filter(([, re]) => re.test(t)).map(([n]) => n);
  rows.push({ id: a.id, pid: a.pid, page: a.page, bucket: bucketOf[a.pid] || 'unclassified',
    coll: a.coll || 1, life: +(((a.act ? NOW : a.end) - a.start) / 86400).toFixed(0),
    angles, primary: angles[0] || 'unclassified', triggers: trigs,
    hook: (a.body || '').split('\n').find(Boolean) || a.title || '',
    link: `https://www.facebook.com/ads/library/?id=${a.id}`, url: a.url || null });
}
const tally = (key, bucket) => {
  const m = {};
  for (const r of rows) { if (bucket && r.bucket !== bucket) continue;
    for (const v of r[key]) { m[v] = m[v] || { n: 0, coll: 0, life: [], pages: new Set() };
      m[v].n++; m[v].coll += r.coll; m[v].life.push(r.life); m[v].pages.add(r.pid); } }
  const tot = rows.filter(r => !bucket || r.bucket === bucket).length || 1;
  return Object.entries(m).map(([k, v]) => ({ name: k, ads: v.n, share: +(v.n / tot * 100).toFixed(1),
    strength: v.coll, pages: v.pages.size,
    median_life: v.life.sort((a, b) => a - b)[Math.floor(v.life.length / 2)] })).sort((a, b) => b.ads - a.ads);
};
const out = { date: DATE, niche: NICHE, total: rows.length,
  taxonomy: (CFG.analysis || {}).angles ? 'niche-config' : 'default-home-services',
  angles: { all: tally('angles'), affiliate: tally('angles', 'affiliate'), branded: tally('angles', 'branded') },
  triggers: { all: tally('triggers'), affiliate: tally('triggers', 'affiliate'), branded: tally('triggers', 'branded') },
  rows };
fs.writeFileSync(path.join(RUN, 'angles.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ok: true, tagged: rows.length, taxonomy: out.taxonomy,
  topAngles: out.angles.all.slice(0, 6).map(x => `${x.name}:${x.share}%`),
  topTriggers: out.triggers.all.slice(0, 6).map(x => `${x.name}:${x.share}%`) }, null, 2));
