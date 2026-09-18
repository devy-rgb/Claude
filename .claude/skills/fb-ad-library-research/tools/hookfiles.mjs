#!/usr/bin/env node
/* video-hooks.md and copy-hooks.md — the two kinds of hook, kept apart.
 *   COPY hook  = the first line of the ad's body text (what you read in-feed)
 *   VIDEO hook = what the viewer HEARS in the first seconds (whisper) and what
 *                is BURNED ON SCREEN in the first 3s (frame OCR)
 * They are written by different people for different moments and must never be
 * ranked in one table.
 * Usage: node hookfiles.mjs --niche roofing --date 2026-09-11
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const S = JSON.parse(fs.readFileSync(path.join(RUN, 'scored.json'), 'utf8'));
let K = {}; try { K = JSON.parse(fs.readFileSync(path.join(RUN, 'scripts.json'), 'utf8')); } catch {}
const q = t => (t || '').replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim();
// "Proven" = survived long enough AND was duplicated. Evidence, not vibes.
const proven = x => x.life >= 14 && x.family_coll >= 3;
const ev = x => `${x.life}d · x${x.family_coll}`;
const rv = x => `R${x.rvert.R_real} V${x.rvert.V_value} E${x.rvert.E_energy} Rk${x.rvert.R_risk} T${x.rvert.T_time}`;

/* ---------- video-hooks.md ---------- */
const vids = S.filter(x => x.kind === 'video');
const V = [`# Video hooks — ${NICHE} · ${DATE}`, '',
  `${vids.length} distinct video creatives. ${vids.filter(x => (K[x.hash] || {}).voice).length} carry a voiceover;`,
  `${vids.filter(x => !(K[x.hash] || {}).voice).length} are music-only text-on-screen.`, '',
  '**Spoken hook** is the first sentence of the voiceover (whisper large-v3-turbo).',
  '**On-screen hook** is text burned into the first 3 seconds (tesseract OCR — stylized ad type',
  'garbles, so treat it as a lead, and open the frame in `frames/` to confirm before swiping).', '',
  'Scores are RVERT `((R×V)−(E+R))/T` from copy + transcript — a structural read of the offer,',
  'not measured performance. Weigh it against lifespan and duplication, which are real evidence.', ''];
for (const b of ['affiliate', 'branded', 'unclassified']) {
  const list = vids.filter(x => x.bucket === b && proven(x)).sort((a, c) => c.score - a.score).slice(0, 15);
  if (!list.length) continue;
  V.push(`## ${b} — proven video creatives (14d+ and x3+)`, '');
  list.forEach((x, i) => {
    const k = K[x.hash] || {};
    V.push(`### ${i + 1}. ${x.page} — ${ev(x)} · RVERT ${x.score}`, '',
      k.voice ? `**Heard:** "${q(k.spoken_hook)}"` : '**Heard:** _(music only — no voiceover)_',
      k.spoken_hook_2 ? `\n**Then:** "${q(k.spoken_hook_2)}"` : '',
      (k.screen_hook || []).length ? `\n**On screen:** ${k.screen_hook.slice(0, 3).map(s => `\`${q(s)}\``).join(' · ')}` : '',
      `\n**Copy hook:** "${q(x.copy_hook).slice(0, 180)}"`, '',
      `- Angle: ${x.angle} · Triggers: ${(x.triggers || []).join(', ') || '-'} · CTA: ${x.cta || '-'}`,
      `- RVERT: ${rv(x)} → **${x.score}** (literal reading: ${x.score_literal})`,
      `- [Ad Library](${x.link}) · file \`${x.file}\``,
      x.url ? `- Landing: ${x.url}` : '', '');
  });
}
V.push('## Full transcripts', '', 'Every script is in `transcripts/<ad-id>-<hash>.txt`. Longest-form scripts:', '',
  '| Words | Page | Alive | Opening line | Link |', '|---|---|---|---|---|');
for (const x of vids.filter(x => (K[x.hash] || {}).words > 60).sort((a, c) => (K[c.hash].words - K[a.hash].words)).slice(0, 20))
  V.push(`| ${K[x.hash].words} | ${q(x.page)} | ${x.life}d | ${q(K[x.hash].spoken_hook).slice(0, 90)} | [ad](${x.link}) |`);
fs.writeFileSync(path.join(RUN, 'video-hooks.md'), V.join('\n'));

/* ---------- copy-hooks.md ---------- */
const C = [`# Copy hooks — ${NICHE} · ${DATE}`, '',
  'The first line of body text — what stops the scroll before any video plays.',
  'Deduped by creative, max 3 per page. Ranked by RVERT; evidence columns are lifespan and duplication.', ''];
for (const b of ['affiliate', 'branded', 'unclassified']) {
  const seen = new Set(); const perPage = {};
  const list = S.filter(x => x.bucket === b && x.copy_hook.length > 15 && proven(x))
    .sort((a, c) => c.score - a.score)
    .filter(x => { const k = q(x.copy_hook).toLowerCase().slice(0, 50);
      if (seen.has(k)) return false; perPage[x.pid] = (perPage[x.pid] || 0) + 1;
      if (perPage[x.pid] > 3) return false; seen.add(k); return true; }).slice(0, 20);
  if (!list.length) continue;
  C.push(`## ${b}`, '', '| # | Copy hook (verbatim) | Page | Alive | Dup. | Fmt | RVERT | Angle | Link |',
    '|---|---|---|---|---|---|---|---|---|');
  list.forEach((x, i) => C.push(`| ${i + 1} | ${q(x.copy_hook).slice(0, 150)} | ${q(x.page)} | ${x.life}d | x${x.family_coll} | ${x.kind} | ${x.score} | ${x.angle} | [ad](${x.link}) |`));
  C.push('');
}
C.push('## Highest RVERT regardless of evidence', '',
  '_Structurally strong offers that have NOT yet proven themselves — hypotheses, not conclusions._', '',
  '| Copy hook | Page | Alive | Dup. | RVERT | Link |', '|---|---|---|---|---|---|');
for (const x of S.filter(x => !proven(x) && x.copy_hook.length > 15).sort((a, c) => c.score - a.score).slice(0, 15))
  C.push(`| ${q(x.copy_hook).slice(0, 120)} | ${q(x.page)} | ${x.life}d | x${x.family_coll} | ${x.score} | [ad](${x.link}) |`);
fs.writeFileSync(path.join(RUN, 'copy-hooks.md'), C.join('\n'));
console.log(JSON.stringify({ ok: true, wrote: ['video-hooks.md', 'copy-hooks.md'],
  provenVideo: vids.filter(proven).length, provenAll: S.filter(proven).length }, null, 2));
