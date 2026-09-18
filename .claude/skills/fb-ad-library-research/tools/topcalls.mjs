#!/usr/bin/env node
/* Call-driven top folder for pay-per-call niches.
 *   node topcalls.mjs --niche aca --date 2026-09-12 [--n 20]
 * Writes <niche>/_top/<date>-call-driven-top<N>/ — numbered symlinks into the
 * creative store plus a README with the call signal, phone number, spoken and
 * on-screen hook, RVERT and every Ad Library link. Ranked by family
 * duplication × days alive (evidence first), RVERT as tiebreak.
 * Reads scored.json (needs score.mjs) and scripts.json; falls back to the
 * manifest if scoring has not run yet. Owned by the ACA run; not part of run.sh.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'aca';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const N = +(argv.n || 20);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE); const RUN = path.join(BASE, '_reports', DATE); const STORE = path.join(BASE, '_creatives');
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const S = rd(path.join(RUN, 'scored.json'), null) || rd(path.join(RUN, 'creatives-manifest.json'), []);
const K = rd(path.join(RUN, 'scripts.json'), {});
const slug = s => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
const q = t => String(t || '').replace(/\n+/g, ' ').trim();
const list = S.filter(x => x.call).sort((a, b) => (b.family_coll * Math.min(b.life, 120)) - (a.family_coll * Math.min(a.life, 120)) || ((b.score || 0) - (a.score || 0))).slice(0, N);
const dir = path.join(BASE, '_top', `${DATE}-call-driven-top${N}`);
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const md = [`# Call-driven top ${N} — ${NICHE} · ${DATE}`, '',
  '_Creatives whose ad is wired for a phone call: Meta CALL_NOW button, a number written into the copy, a `tel:` link, or an explicit call ask. Ranked by duplication × lifespan (evidence), RVERT as tiebreak. Ads that promise NO call are excluded even when they mention phones._', '',
  'Files are symlinks into `_creatives/`; nothing is duplicated.', '',
  '| # | Alive | Dup. | Signal | Number | Bracket | Page | RVERT | Ad Library |', '|---|---|---|---|---|---|---|---|---|'];
list.forEach((x, i) => {
  const n = String(i + 1).padStart(2, '0'); const ext = x.kind === 'video' ? 'mp4' : 'jpg';
  const src = path.join(STORE, `${x.hash}.${ext}`); const dst = path.join(dir, `${n}-${x.life}d-x${x.family_coll}-${slug(x.page)}.${ext}`);
  if (fs.existsSync(src)) { try { fs.symlinkSync(path.relative(dir, src), dst); } catch {} }
  md.push(`| ${n} | ${x.life}d | x${x.family_coll} | ${(x.call_signals || []).join('+')} | ${x.phone || '-'} | ${x.bucket} | ${q(x.page)} | ${x.score ?? '-'} | [open](${x.link}) |`);
});
md.push('', '---', '');
list.forEach((x, i) => {
  const k = K[x.hash] || {}; const r = x.rvert;
  md.push(`## ${String(i + 1).padStart(2, '0')}. ${q(x.page)} — ${x.life}d · x${x.family_coll}${x.score != null ? ' · RVERT ' + x.score : ''}`, '',
    `**Copy hook:** "${q(x.copy_hook).slice(0, 220)}"`, x.title ? `**Title:** "${q(x.title).slice(0, 160)}"` : '', '',
    x.kind === 'video' ? (k.voice ? `**Heard first:** "${q(k.spoken_hook).slice(0, 220)}"${k.spoken_hook_2 ? `\n\n**Then:** "${q(k.spoken_hook_2).slice(0, 220)}"` : ''}` : '**Heard first:** _(no voiceover — silent / music only)_') : '**Format:** image',
    (k.screen_hook || []).length ? `\n**On screen (first 3s, OCR):** ${k.screen_hook.slice(0, 3).map(s => '`' + q(s) + '`').join(' · ')}` : '', '',
    `- **Call signal**: ${(x.call_signals || []).join(', ') || '-'}${x.phone ? ' · number ' + x.phone : ''} · CTA ${x.cta || '-'}`,
    r ? `- **RVERT**: Real ${r.R_real} × Value ${r.V_value} − (Energy ${r.E_energy} + Risk ${r.R_risk}) ÷ √Time ${r.T_time} × U${x.urgency} → **${x.score}**${(x.devices || []).length ? ' · devices: ' + x.devices.join(', ') : ''}` : '',
    `- **Angle**: ${x.angle} · **Triggers**: ${(x.triggers || []).join(', ') || '-'}`,
    `- **Ad Library**: ${x.link}${x.url ? `\n- **Landing**: ${x.url}` : ''}`,
    `- **File**: \`${path.basename(dir)}/${String(i + 1).padStart(2, '0')}-${x.life}d-x${x.family_coll}-${slug(x.page)}.${x.kind === 'video' ? 'mp4' : 'jpg'}\``,
    k.voice && k.text ? `\n<details><summary>full script</summary>\n\n${k.text.slice(0, 2000)}\n\n</details>` : '', '');
});
fs.writeFileSync(path.join(dir, 'README.md'), md.filter(l => l !== null).join('\n'));
console.log(JSON.stringify({ ok: true, n: list.length, dir, scored: !!S[0]?.rvert, withScript: list.filter(x => (K[x.hash] || {}).voice).length }));
