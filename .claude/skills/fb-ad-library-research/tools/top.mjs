#!/usr/bin/env node
/* Build a browsable "top N by RVERT" folder for a run.
 *   node top.mjs --niche roofing --date 2026-09-11 [--n 10]
 * Writes <niche>/_top/<date>-rvert-top<N>/ and -proven/ containing numbered
 * symlinks into the creative store plus a README.md with every Ad Library link.
 * Symlinks, so a top folder costs nothing and never duplicates the store.
 *
 * Two cuts, deliberately:
 *   raw    — highest RVERT, whatever the evidence. Structurally strong offers.
 *   proven — highest RVERT among creatives alive 14d+ AND duplicated x3+.
 * A high score with no duplication is a hypothesis; with duplication it's a
 * conclusion. Ship both and say which is which.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { rankByAggressiveness, rankByRvert, activeDeviceWeights, AGGRESSIVE_TOP_N, lifeOf } from './rank.mjs';
import { loadNiche } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const N = +(argv.n || 20);                       // new launches + proven folders
const AGG_N = +(argv['agg-n'] || AGGRESSIVE_TOP_N);   // most-aggressive folder (default 50)
const RVERT_N = +(argv['rvert-n'] || AGGRESSIVE_TOP_N);   // raw top-by-RVERT folder (default 50)
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE);
const RUN = path.join(BASE, '_reports', DATE);
const STORE = path.join(BASE, '_creatives');

const S = JSON.parse(fs.readFileSync(path.join(RUN, 'scored.json'), 'utf8'));
let K = {}; try { K = JSON.parse(fs.readFileSync(path.join(RUN, 'scripts.json'), 'utf8')); } catch {}
const slug = s => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
const proven = x => lifeOf(x) >= 14 && x.family_coll >= 3;

function build(list, dir, label, note, metric = 'rvert') {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const primary = x => metric === 'aggressiveness' ? x.aggressiveness : x.score;
  const primaryLabel = metric === 'aggressiveness' ? 'Aggr.' : 'RVERT';
  const md = [`# ${label} — ${NICHE} · ${DATE}`, '', note, '',
    `Files here are symlinks into \`_creatives/\`; nothing is duplicated.`, '',
    `| # | ${primaryLabel} | RVERT | Alive | Dup. | Bracket | Page | Ad Library |`, '|---|---|---|---|---|---|---|---|'];
  list.forEach((x, i) => {
    const n = String(i + 1).padStart(2, '0');
    const ext = x.kind === 'video' ? 'mp4' : 'jpg';
    const src = path.join(STORE, `${x.hash}.${ext}`);
    const dst = path.join(dir, `${n}-score${primary(x)}-${slug(x.page)}.${ext}`);
    if (fs.existsSync(src)) { try { fs.symlinkSync(path.relative(dir, src), dst); } catch {} }
    const pageCell = (x.variant_pages && x.variant_pages.length > 1) ? `${x.page} +${x.variant_pages.length - 1} more` : x.page;
    md.push(`| ${n} | **${primary(x)}** | ${x.score} | ${lifeOf(x)}d | x${x.family_coll} | ${x.bucket} | ${pageCell} | [open](${x.link}) |`);
  });
  md.push('', '---', '');
  list.forEach((x, i) => {
    const k = K[x.hash] || {}; const r = x.rvert;
    md.push(`## ${String(i + 1).padStart(2, '0')}. ${x.page} — ${primaryLabel} ${primary(x)}`, '',
      `**Copy hook:** "${(x.copy_hook || '').replace(/\n/g, ' ').slice(0, 220)}"`, '',
      x.kind === 'video'
        ? (k.voice ? `**Heard first:** "${(k.spoken_hook || '').slice(0, 200)}"` : '**Heard first:** _(no voiceover — silent/music only)_')
        : '**Format:** image', '',
      metric === 'aggressiveness' ? `- **Devices**: ${(x.devices || []).join(', ') || '-'} → **aggressiveness ${x.aggressiveness}**` : '',
      `- **RVERT**: Real ${r.R_real} × Value ${r.V_value} − (Energy ${r.E_energy} + Risk ${r.R_risk}) ÷ Time ${r.T_time} → **${x.score}** _(literal reading: ${x.score_literal})_`,
      `- **Evidence**: alive ${lifeOf(x)}d · duplicated x${x.family_coll} across ${x.pages} page(s) · ${proven(x) ? '**proven**' : '_not yet proven_'}`,
      (x.variant_pages && x.variant_pages.length > 1)
        ? `- **Network**: same script collapsed from ${x.geo_variants} near-identical geo/city variants across ${x.variant_pages.length} page fronts — ${x.variant_pages.join(', ')}`
        : (x.geo_variants > 1 ? `- **Geo variants collapsed**: x${x.geo_variants} (this page only)` : ''),
      `- **Angle**: ${x.angle} · **Triggers**: ${(x.triggers || []).join(', ') || '-'} · **CTA**: ${x.cta || '-'}`,
      `- **Ad Library**: ${x.link}`,
      x.url ? `- **Landing page**: ${x.url}` : '',
      `- **File**: \`${path.basename(dir)}/${String(i + 1).padStart(2, '0')}-score${primary(x)}-${slug(x.page)}.${x.kind === 'video' ? 'mp4' : 'jpg'}\``,
      k.voice && k.text ? `\n<details><summary>full script</summary>\n\n${k.text.slice(0, 1800)}\n\n</details>` : '', '');
  });
  fs.writeFileSync(path.join(dir, 'README.md'), md.join('\n'));
  return list.length;
}

const topDir = path.join(BASE, '_top');
fs.mkdirSync(topDir, { recursive: true });
// THE AGGRESSIVE CUT IS THE PRIMARY DELIVERABLE. you buys aggressive
// lead-gen; the full corpus is ~83% mid-tier contractor ads that would carry a
// much higher lead cost. Ads carrying at least one device are duplicated ~3x
// harder by their own advertisers, which is the market's verdict, not ours.
const NICHE_WEIGHTS = ((loadNiche(NICHE).analysis || {}).aggression_weights) || {};
const aggressive = S.filter(x => x.aggression > 0);
const mostAggressive = rankByAggressiveness(S, AGG_N);
const deviceLegend = activeDeviceWeights(S, NICHE_WEIGHTS).map(([l, w]) => `${l} = ${w}`).join(' · ') || 'no device carries any ad in this niche';
const a = build(mostAggressive, path.join(topDir, `${DATE}-aggressive-top${AGG_N}`), `Top ${AGG_N} most aggressive ads`,
  `_Ranked by **aggressiveness**: the weighted devices each ad uses (${deviceLegend}). Ties break by urgency, then RVERT, then duplication. Geo-swapped copies of one ad count once. **Start here.**_`,
  'aggressiveness');
const fresh = S.filter(x => lifeOf(x) < 14 && x.family_coll >= 3).sort((x, y) => y.family_coll - x.family_coll);
const c = build(fresh.slice(0, N), path.join(topDir, `${DATE}-new-launches`), `Launched <14d, already scaling`,
  '_Creatives launched in the last two weeks that are ALREADY duplicated 3+ times. An advertiser cloning a two-week-old creative has decided fast that it works — this is the earliest read available on a new winner._');
const b = build(S.filter(proven).slice(0, N), path.join(topDir, `${DATE}-rvert-top${N}-proven`), `Top ${N} by RVERT — proven`,
  '_Highest RVERT among creatives alive 14+ days AND duplicated 3+ times, aggressive or not._');
// Companion to the aggressiveness cut above: same population, ranked by the
// OTHER metric (believability x payoff, not pressure tactics), unfiltered by
// evidence. The two rankings measure different things and are expected to
// disagree — see score.mjs's header comment.
const d = build(rankByRvert(S, RVERT_N), path.join(topDir, `${DATE}-rvert-top${RVERT_N}`), `Top ${RVERT_N} by RVERT`,
  '_Ranked purely by RVERT — `((Real x Value) - (Energy + Risk)) / sqrt(Time) x Urgency`, a structural read of how believable and valuable the offer looks to a cold homeowner. No aggressiveness or evidence filter (that is the separate "proven" cut above, and the aggressiveness ranking is a different metric entirely — a high-RVERT ad can use zero pressure tactics, and vice versa). Geo-swapped copies of one ad count once._');
console.log(JSON.stringify({ ok: true, aggressive: a, newLaunches: c, proven: b, rvertTop: d,
  aggressiveTotal: aggressive.length, freshTotal: fresh.length, dir: topDir }, null, 2));
