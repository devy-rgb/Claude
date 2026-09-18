#!/usr/bin/env node
/* RVERT scoring — your lead-form formula.
 *
 *     score = ((R1 x V) - (E + R2)) / T
 *
 *   R1  Real          1-10  how believable the offer looks to a cold homeowner
 *   V   Value         1-10  size of the payoff after taking action
 *   E   Energy        1-10  attention + comprehension + clicks + typing required
 *   R2  Risk          1-10  spam, a salesman, looking stupid
 *   T   Time to value 1-10  how long until the payoff actually lands
 *
 * The user wrote the formula as "(( R x V ) - ( E + R ) / T )". Read with
 * strict precedence that divides only the friction term, which makes a SLOWER
 * payoff score BETTER — backwards. We default to `strict:false` (whole
 * numerator over T) and also emit `score_literal` so both readings are visible.
 *
 * Every point is attributable: each dimension returns the signals that moved
 * it, so a score can be argued with instead of taken on faith. These are
 * heuristics read off ad copy and transcripts — NOT measured user behaviour.
 *
 * Usage: node score.mjs --niche roofing --date 2026-09-11 [--strict]
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, rx, compileSpec, compileRules } from './lib.mjs';
import { aggressivenessScore } from './rank.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const STRICT = !!argv.strict;

const clamp = n => Math.max(1, Math.min(10, Math.round(n * 10) / 10));

/* rule: [regex, delta, label] — applied to the ad's full text (copy + transcript)
 *
 * v2 (2026-09-11). v1 ranked vanilla "instant quote" contractor ads at the top.
 * Three things were wrong, all fixed here:
 *
 *  1. REAL measured LEGITIMACY, not BELIEVABILITY. It rewarded BBB/licensed/
 *     family-owned (branded-contractor tells) and punished bold pricing and
 *     program framing. But in aggressive lead-gen the outrageous claim is the
 *     hook — what makes it land is a REASON-WHY ("factory-direct, no
 *     middlemen, discontinued shingle lines"). So: reward mechanism, and
 *     punish a bold claim only when NO mechanism explains it.
 *  2. T measured time-to-ROOF instead of time-to-THE-PAYOFF-THE-AD-PROMISES.
 *     Aggressive ads promise "find out if you qualify" — fast. They were
 *     being scored as slow because the copy mentions installation.
 *  3. T was a raw 1-10 divisor, so it dominated everything. 1/T correlated
 *     0.62 with the final score and 6 of the top 10 sat at the T floor.
 *     T is now clamped to 1-6 and measures the right event.
 *
 * Also added: AGGRESSION INDEX — the devices that separate your swipe file
 * from vanilla contractor ads (price shock, anchor gap, specific scarcity
 * counts, hard deadline, objection pre-emption, qualification-as-exclusion).
 * Reported alongside the score, not folded into it, so the formula stays his.
 */
const REAL = { base: 4, rules: [
  [/factory[- ]?direct|no middle ?m[ae]n|direct (from )?(the )?(manufacturer|supplier)|direct (manufacturer|supplier) relationship|discontinued (shingle|line)|lean (and mean|operation)|small (local )?(team|crew|operation)|no showroom|skip.{0,20}markup|zero middlemen|overstock|bulk/i, +3.0, 'reason-why mechanism for the price'],
  [/(federal|government|state).{0,40}(allocation|funding|rebate|program|credit)|storm[- ]restoration|energy[- ]efficient.{0,20}(allocation|rebate|program)|insurance may|through your insurance/i, +2.0, 'named funding mechanism'],
  // The beta/trial mechanism: "we need homeowners to test this". It is the
  // device behind the single most-duplicated creative in the niche (x436
  // "50 Homeowners Needed To Try This Free Pop-In Roof Connection Service"),
  // and it reframes the ask as doing THEM a favour rather than buying.
  [/\b(use your (house|home) to (trial|test)|looking for \d* ?homeowners? to (test|try|trial)|\d+ homeowners? needed|to (trial|test) (this|their|our)|test this (innovative|new)|we.{0,4}re looking for \d+ homeowners?|trial (expires|program)|beta)\b/i, +2.5, 'beta/trial mechanism (does them a favour)'],
  // Side-by-side price demo: two identical outcomes, wildly different prices.
  [/(one|top).{0,40}paid (over )?\$\s?\d[\d,]{2,}.{0,60}(other|bottom).{0,30}\$\s?\d+|both got .{0,40}but the one/i, +2.0, 'side-by-side price demo'],
  [/sounds? (impossible|crazy|fake|too good|like a scam)|i know what you.{0,10}re thinking|no way that.{0,5}s real|i didn.{0,3}t believe it either|yeah,? that sounds|watch me prove|sounds fake,? right/i, +2.2, 'pre-empts the disbelief itself'],
  [/shingles?,? (and )?(underlayment|flashing)|flashing,? (and )?vents|drip edge|ridge cap|tear[- ]?off|full tear|underlayment/i, +1.5, 'itemised scope (specific, checkable)'],
  [/\$\s?\d[\d,]{2,}\b.{0,60}\$\s?\d[\d,]{2,}\b/, +1.2, 'two concrete numbers, not a vague claim'],
  [/\b(GAF|Owens Corning|CertainTeed|BBB|A\+ rating|licensed|insured)\b/i, +0.8, 'credential named'],
  [/\b\d{1,3}[-.) ]\d{3}[-.]\d{4}\b/, +0.5, 'phone number shown'],
  [/\b(save big|great (price|deal)|best (quality|price)|top[- ]rated|quality you can trust|trusted name|your trusted)\b/i, -1.2, 'vague claim, nothing checkable'],
]};
/* A bold claim with no mechanism is the one thing that reads as fake. Applied
   after the rules so it can see whether any mechanism rule fired. */
// 2026-09-13: whole-word "free roof" (not "free roofing estimate") and dollar
// figures that are DISCOUNTS ("save $1,000", "$2,000 off") are not roof prices.
const BOLD = /(?<!save |saving |save up to |up to |discount of |rebate of |credit of |an extra |extra )\$\s?(19\.99|[1-3][,.]?\d{3})\b(?!\s*(off|discount|savings?|rebate|credit|toward|towards|in savings|bonus|value|gift card))|\bfree (new )?roof\b(?!ing|er|s? (inspection|estimate|quote|assessment|consultation))|\$0 out of pocket|no cost to you|for (just|only) \$\s?\d/i;

const VALUE = { base: 3, rules: [
  [/\$\s?(1[0-9]|[2-9])[,.]?\d{3}\b.{0,80}\$\s?(19\.99|[1-3][,.]?\d{3})\b|most (companies|contractors) charge.{0,40}\$|would charge \$\s?\d|usually run \$|quoted \d{2},?\d{3}|paid (over )?\$\s?\d[\d,]{2,}.{0,60}only paid|drop \$\s?\d[\d,]{2,} or more/i, +4.0, 'explicit anchor gap (their price vs the market)'],
  [/\bfree (new )?roof\b(?!ing|er|s? (inspection|estimate|quote|assessment|consultation))|\$0 out of pocket|no cost to you|completely free|at no cost|for no cost|won.{0,3}t cost you anything|without any (initial )?(cost|expense)|pennies on the dollar|only paid \$\d{1,3}\b/i, +3.5, 'free / zero out of pocket'],
  [/(?<!save |saving |save up to |up to |discount of |rebate of |credit of |an extra |extra )\$\s?(19\.99|[1-2][,.]?\d{3}|3[,.]?[0-4]\d{2})\b(?!\s*(off|discount|savings?|rebate|credit|toward|towards|in savings|bonus|value|gift card))(?!.{0,15}(month|\/mo))/i, +2.5, 'full roof priced under ~$3.5k'],
  [/save (up to )?\$?\s?([5-9]|[1-9]\d)[,.]?\d{3}|saved \$?\s?\d{1,2},?\d{3}|\$\s?([5-9]|[1-9]\d)[,.]?\d{3}\s*(off|savings|less)/i, +2.0, 'large stated savings'],
  [/(full|complete|whole)( home)? (roof )?(replacement|re-?roof)|brand new roof/i, +1.5, 'full replacement, not a repair'],
  [/\b(0% interest|no money down|no payments?|financing|approved in)\b/i, +1.0, 'financing removes the barrier'],
  [/\b(lifetime|50[- ]?(yr|year)|20[- ]?plus years?|decades)\b/i, +0.8, 'durability'],
  [/\b(free|no[- ]cost) (roof )?(inspection|estimate|quote|consultation)\b/i, -2.0, 'payoff is only information'],
  [/\b(repair|patch|fix a leak)\b/i, -1.0, 'repair, not replacement'],
]};
const ENERGY = { base: 4, rules: [
  [/\b(call (us )?now|give us a call|call today|call for)\b/i, +2.2, 'phone call required'],
  [/\b(answer|take) (a few|\d+|three|3) (quick )?questions?\b|\bquiz\b|\bsurvey\b/i, +1.6, 'multi-step quiz'],
  [/\b(schedule|book) (a |your )?(free )?(appointment|consultation|estimate|inspection)\b/i, +1.5, 'appointment booking'],
  [/\b(name|email).{0,25}(phone|email|name)/i, +1.5, 'multi-field form'],
  [/\benter (your )?zip\b|\bzip code\b|check your zip|drop in your zip/i, -1.5, 'single zip field'],
  [/\b(instant|instantly|in (under )?\d+ seconds?|takes? \d+ seconds?|60 seconds|in less than a minute|apply online)\b/i, -1.5, 'speed promised'],
  [/\b(no (forms?|paperwork|obligation|commitment|hassle)|no strings)\b/i, -1.2, 'friction disarmed'],
  [/\b(tap|click) (below|learn more|get quote)\b/i, -0.8, 'one tap'],
]};
const RISK = { base: 5, rules: [
  [/sounds? (impossible|crazy|fake|too good|like a scam)|i know what you.{0,10}re thinking|no way that.{0,5}s real|i didn.{0,3}t believe it either/i, -1.8, 'names the objection before you can'],
  [/\bno (salesman|sales ?person|pushy|pressure|obligation|hassle)\b|no strings attached/i, -2.0, 'salesman risk disarmed'],
  [/factory[- ]?direct|no middle ?m[ae]n|discontinued|small (local )?(team|crew)/i, -1.2, 'mechanism makes the price make sense'],
  [/\b(BBB|A\+ rating|licensed|insured|accredited|approved)\b/i, -1.0, 'third-party marker'],
  [/\b\d{1,3}[,.]?\d{0,3}\+? (homeowners|customers|reviews|roofs)\b|homeowners in your area are already/i, -0.8, 'volume proof'],
  [/\b(salesman|sales rep|representative will|someone will (call|contact|reach))\b/i, +1.5, 'implies a sales call'],
  [/\b(in[- ]home|home visit|come out to)\b/i, +1.0, 'home visit'],
  [/[\u{1D400}-\u{1D7FF}]/u, +1.0, 'unicode-styled text reads as spam'],
  [/\b(call (us )?now|phone)\b/i, +0.8, 'phone exposure'],
]};
/* Time to the payoff THE AD PROMISES — usually "find out if you qualify" or
   "see your price", NOT the day the roof gets installed. Clamped 1-6 below. */
const TIME = { base: 4, rules: [
  [/\b(instant|instantly|right now|see (your )?(price|quote)|calculate quote|in (under )?\d+ seconds?|check your zip|drop in your zip|apply online in less than a minute)\b/i, -2.0, 'answer is immediate'],
  [/\b(approved in 24 hours|same[- ]day|within 24 hours|next day|(quote|price|answer|approval|results?) today)\b/i, -1.2, 'answer within a day'],
  [/\b(see if you qualify|check (your )?eligibilit|verify your property|check now)\b/i, -1.0, 'qualification answer is the payoff'],
  [/\b(schedule|book|appointment|consultation)\b.{0,30}(estimate|inspection|consultation)/i, +1.5, 'must schedule a visit first'],
  [/\b(apply|application|approval)\b/i, +0.8, 'approval step'],
  [/\b(weeks?|\d+ ?- ?\d+ days|two weeks later)\b/i, +0.8, 'explicit multi-day wait'],
]};
/* The devices that separate your swipe file from vanilla contractor ads.
   Reported next to the score, deliberately NOT folded into it. */
const AGGRESSION = [
  [/(?<!save |saving |save up to |up to |discount of |rebate of |credit of |an extra |extra )\$\s?(19\.99|[1-3][,.]?\d{3})\b(?!\s*(off|discount|savings?|rebate|credit|toward|towards|in savings|bonus|value|gift card)).{0,40}(roof|replacement)|roof.{0,30}(?<!save |saving |save up to |up to |discount of |rebate of |credit of |an extra |extra )\$\s?(19\.99|[1-3][,.]?\d{3})\b(?!\s*(off|discount|savings?|rebate|credit|toward|towards|in savings|bonus|value|gift card))/i, 'price shock'],
  [/most (companies|contractors) charge|would charge \$|usually run \$|i got quoted|\$\s?[12]?\d,?\d{3}\s*(to|-|–)\s*\$\s?\d{2},?\d{3}/i, 'anchor gap named'],
  [/\b\d{1,3}\s*(slots?|spots?|openings?|positions?|homes?|projects?|installs?|jobs?|households?|homeowners?)\s*(left|remain(ing)?|per|total|available|needed|only|max)|\b(only|just)\s*\d{1,3}\s*(slots?|spots?|openings?|homes?|homeowners?|left)|\b\d{1,3}\s*(homeowners?|spots?|slots?)\s*(needed|wanted|required)|first \d{1,3} (homeowners?|callers?|people)/i, 'specific scarcity count'],
  [/\b(deadline is|shuts down|ends? (soon|friday|tuesday|december)|before (friday|tuesday|midnight)|expires?|after friday|next 24 hours|closing|last chance)\b/i, 'hard deadline'],
  [/sounds? (impossible|crazy|fake|too good|like a scam)|i know what you.{0,10}re thinking|no way that.{0,5}s real|i didn.{0,3}t believe it either|watch me prove/i, 'objection pre-empt'],
  [/\b(who actually qualifies|you must be|only for homeowners who|approved zip|eligible zip|qualifying (homeowners|neighborhoods)|lose your eligibility)\b/i, 'qualification as exclusion'],
  [/factory[- ]?direct|no middle ?m[ae]n|discontinued (shingle|line)|direct (manufacturer|supplier)|here.{0,3}s how (we|they).{0,3}(re )?doing it|that.{0,3}s how|the price comes from|this (pricing|price) exists because|why (so cheap|it.{0,3}s cheaper)|we (skip|cut out) (all )?the|overstock|lean (and mean|operation)|no showroom|zero middlemen|bulk (buy|pricing)/i, 'reason-why mechanism'],
  // 2026-09-13: only loss tied to the OFFER or its deadline. Bare "too late" / "forever" matched contractor
  // damage cliches ("don't wait until it's too late") and product claims ("your forever roof").
  [/(claim|apply|sign up|do this|tap|click|call|act|check|lock in|grab|get (yours|it|in))[^.!?\n]{0,40}before it.{0,3}s too late|\b(pay(ing)? full price|stuck paying|lose (it|this|out|your (spot|eligibility|chance)))[^.!?\n]{0,25}\b(forever|permanently)\b|\b(program|offer|pricing|price|enrollment|eligibility|funding)[^.!?\n]{0,30}\b(ends|closes|gone|back to retail)[^.!?\n]{0,15}\b(forever|permanently)\b|\bpay five times more\b|\bstuck paying full price\b|\bor lose\b|\bdon.{0,3}t be dumb\b/i, 'loss framing on the deadline'],
];

/* Per-niche rule sets. A niche config may carry `analysis.rvert.{real,value,
   energy,risk,time}` ({base, rules:[[pattern, delta, label]]}), `.bold`
   (pattern), `.aggression` ([[pattern, label]]) and `.urgency`
   ([[pattern, delta, label]]). Anything absent falls back to the built-in
   home-services rules above, so roofing is unchanged. Labels still drive the
   `mechanised` check below — a reason-why rule's label must contain
   "mechanism", "pre-empts", "itemised" or "funding". */
const RV = ((loadNiche(NICHE).analysis || {}).rvert) || {};
const SPEC = {
  REAL: RV.real ? compileSpec(RV.real) : REAL,
  VALUE: RV.value ? compileSpec(RV.value) : VALUE,
  ENERGY: RV.energy ? compileSpec(RV.energy) : ENERGY,
  RISK: RV.risk ? compileSpec(RV.risk) : RISK,
  TIME: RV.time ? compileSpec(RV.time) : TIME,
  BOLD: RV.bold ? rx(RV.bold) : BOLD,
  AGGRESSION: RV.aggression ? compileRules(RV.aggression) : AGGRESSION,
  URGENCY: RV.urgency ? compileRules(RV.urgency) : null,
  source: Object.keys(RV).length ? 'niche-config' : 'default-home-services'
};


function dim(spec, text, lo = 1, hi = 10) {
  let v = spec.base; const why = [];
  for (const [re, d, label] of spec.rules) if (re.test(text)) { v += d; why.push(`${d > 0 ? '+' : ''}${d} ${label}`); }
  return { v: Math.max(lo, Math.min(hi, Math.round(v * 10) / 10)), why, hit: why.length };
}

const manifest = JSON.parse(fs.readFileSync(path.join(RUN, 'creatives-manifest.json'), 'utf8'));
let scripts = {};
try { scripts = JSON.parse(fs.readFileSync(path.join(RUN, 'scripts.json'), 'utf8')); } catch {}

const scored = manifest.map(c => {
  const script = (scripts[c.hash] && scripts[c.hash].text) || '';
  const text = `${c.body}\n${c.title}\n${c.cta || ''}\n${script}`;
  const R1 = dim(SPEC.REAL, text), V = dim(SPEC.VALUE, text), E = dim(SPEC.ENERGY, text),
        R2 = dim(SPEC.RISK, text);
  // T is clamped to 1-6: as a raw 1-10 divisor it drowned every other dimension.
  const T = dim(SPEC.TIME, text, 1, 6);
  // A bold price/free claim with no mechanism and no objection pre-empt is the
  // one pattern that actually reads as fake. Applied here so it can see whether
  // any believability rule fired.
  const mechanised = R1.why.some(w => /mechanism|pre-empts|itemised|funding/.test(w));
  if (SPEC.BOLD.test(text) && !mechanised) { R1.v = Math.max(1, +(R1.v - 2.5).toFixed(1)); R1.why.push('-2.5 bold claim with no reason-why'); }
  const devices = SPEC.AGGRESSION.filter(([re]) => re.test(text)).map(([, n]) => n);
  // URGENCY ("why now"): RVERT models the economics of the click — payoff vs
  // cost — but has no term for why someone acts NOW instead of later. Two ads
  // with identical R/V/E/Rk/T score the same with or without "11 slots left
  // this week", and convert very differently. U is a multiplier, 1.0-1.9.
  const URGENCY = [
    [/\b\d{1,2}\s*(slots?|spots?|openings?|positions?|homes?|projects?)\s*(left|remain|per|total|available)/i, 0.30, 'specific scarcity count'],
    [/\b(deadline is|shuts? down|program ends|ends (soon|friday|tuesday)|before (friday|tuesday|midnight)|next 24 hours|closing|enrollment)\b/i, 0.25, 'hard deadline'],
    [/\b(or (you.{0,4}ll )?pay|stuck paying|goes back to retail|lose your eligibility|five times more)\b|(claim|apply|sign up|do this|tap|click|call|act|check|lock in|grab|get (yours|it|in))[^.!?\n]{0,40}before it.{0,3}s too late|\b(pay(ing)? full price|stuck paying|lose (it|this|out|your (spot|eligibility|chance)))[^.!?\n]{0,25}\b(forever|permanently)\b|\b(program|offer|pricing|price|enrollment|eligibility|funding)[^.!?\n]{0,30}\b(ends|closes|gone|back to retail)[^.!?\n]{0,15}\b(forever|permanently)\b|\bpay five times more\b|\bstuck paying full price\b|\bor lose\b|\bdon.{0,3}t be dumb\b/i, 0.20, 'loss framing on the deadline'],
    [/\b(last chance|limited (time|spots|slots)|while .{0,15}last|first come|booking fast|almost full|filling up)\b/i, 0.10, 'generic scarcity'],
  ];
  const URG = SPEC.URGENCY || URGENCY;
  const uWhy = URG.filter(([re]) => re.test(text)).map(([, d, n]) => `+${d} ${n}`);
  const U = +(1 + URG.filter(([re]) => re.test(text)).reduce((a, [, d]) => a + d, 0)).toFixed(2);
  const num = (R1.v * V.v) - (E.v + R2.v);
  // sqrt(T): as a raw divisor T drowned everything (1/T correlated 0.62 with
  // the score, and 6 of the v1 top 10 sat at the T floor). sqrt cuts that to
  // ~0.33 while keeping slower payoffs genuinely penalised.
  const score = +((num / Math.sqrt(T.v)) * U).toFixed(2);
  const literal = +((R1.v * V.v) - ((E.v + R2.v) / T.v)).toFixed(2);
  const score_plain_T = +(num / T.v).toFixed(2);
  return { ...c, script,
    rvert: { R_real: R1.v, V_value: V.v, E_energy: E.v, R_risk: R2.v, T_time: T.v },
    why: { real: R1.why, value: V.why, energy: E.why, risk: R2.why, time: T.why },
    aggression: devices.length, devices,
    aggressiveness: aggressivenessScore(devices, (loadNiche(NICHE).analysis || {}).aggression_weights || {}),
    urgency: U, why_urgency: uWhy,
    score, score_literal: literal, score_plain_T };
}).sort((a, b) => (STRICT ? b.score_literal - a.score_literal : b.score - a.score));

fs.writeFileSync(path.join(RUN, 'scored.json'), JSON.stringify(scored, null, 2));
const v = scored.filter(x => x.kind === 'video'), i = scored.filter(x => x.kind === 'image');
console.log(JSON.stringify({ ok: true, rules: SPEC.source, scored: scored.length, video: v.length, image: i.length,
  withScript: scored.filter(x => x.script).length,
  topScore: scored[0] && scored[0].score, medianScore: scored[Math.floor(scored.length / 2)].score,
  meanAggression: +(scored.reduce((s, x) => s + x.aggression, 0) / scored.length).toFixed(2),
  top10meanAggression: +(scored.slice(0, 10).reduce((s, x) => s + x.aggression, 0) / 10).toFixed(2),
  meanUrgency: +(scored.reduce((s, x) => s + x.urgency, 0) / scored.length).toFixed(2),
  top10meanUrgency: +(scored.slice(0, 10).reduce((s, x) => s + x.urgency, 0) / 10).toFixed(2) }, null, 2));
