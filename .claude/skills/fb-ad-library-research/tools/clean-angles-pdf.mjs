#!/usr/bin/env node
/* clean-angles-pdf.mjs — the compliant-angles report: every angle in the clean set, its analysis,
 * and only the top 2–3 ads per angle. Reads <run>/clean-ads/clean-ads.json (clean-ads.mjs) and
 * <run>/clean-ads/REPORT.md:
 *   ## Headline · ## The read (numbered) · ## Angle: <name> (bullets "- **Label:** text", optional
 *   "- **Picks:** hash-prefix, …") · ## Formats, CTAs and landing · ## Test plan · ## Rules
 * Angle per ad comes from review.json "angle"; bracket from "bracket".
 *
 * Top ads: near-identical copy (Jaccard ≥ 0.72 on title+body words) merges into one concept; concepts
 * rank by live ads + 2 × extra pages, then days live; one concept per advertiser unless the angle has
 * fewer advertisers than picks. "Picks" in REPORT.md overrides (marked editorial).
 *
 * Optional "## What changed since …" section renders after The read, with a table of the biggest new launchers
 * (needs clean-ads.mjs --also-raw). --data-label overrides the cover's data line.
 *
 * Usage: node clean-angles-pdf.mjs --niche bathroom-remodeling --date 2026-09-13 [--root <p>] [--store <p>] [--out <pdf>] [--data-label <text>]
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { loadNiche } from './lib.mjs';

const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'bathroom-remodeling';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const STORE = argv.store || path.join(ROOT, NICHE);
const DIR = path.join(ROOT, NICHE, '_reports', DATE, 'clean-ads');
const LABEL = (loadNiche(NICHE).label || NICHE).split('/')[0].trim();
const TODAY = new Date().toLocaleDateString('en-CA');   // local date, not UTC
const TITLE_SLUG = NICHE.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-');
const OUT = (argv.out || path.join(os.homedir(), 'Downloads', `${TITLE_SLUG}-Compliant-Angles-${TODAY}.pdf`)).replace(/^~/, os.homedir());
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'angles-pdf-'));

const { rows, summary } = JSON.parse(fs.readFileSync(path.join(DIR, 'clean-ads.json'), 'utf8'));
const MD = fs.readFileSync(path.join(DIR, 'REPORT.md'), 'utf8');
const sectionsOf = () => { const out = []; const re = /^## (.+)$/gm; let m, last = null;
  while ((m = re.exec(MD))) { if (last) last.body = MD.slice(last.end, m.index).trim(); last = { name: m[1].trim(), end: re.lastIndex }; out.push(last); }
  if (last) last.body = MD.slice(last.end).trim(); return out; };
const SECTIONS = sectionsOf();
const sec = name => (SECTIONS.find(s => s.name === name) || {}).body || '';
const listItems = md => md.split('\n').filter(l => /^(\d+\.|-)\s/.test(l)).map(l => l.replace(/^(\d+\.|-)\s+/, ''));
const bulletMap = md => Object.fromEntries(listItems(md).map(l => { const m = l.match(/^\*\*(.+?):\*\*\s*(.*)$/); return m ? [m[1], m[2]] : [l, '']; }));

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const n0 = v => Number(v).toLocaleString('en-US');
const cap = s => String(s || '').replace(/^\s*([a-z])/, (m, c) => m.replace(c, c.toUpperCase()));
const inline = s => esc(cap(s)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
const med = a => { a = [...a].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };

function thumb(r) {
  const cands = r.kind === 'image' ? [path.join(STORE, '_creatives', `${r.hash}.jpg`)]
    : r.kind === 'video' ? ['t1.5', 't3', 't0.5'].map(t => path.join(STORE, '_frames', `${r.hash}-${t}.jpg`)) : [];
  const use = cands.find(f => fs.existsSync(f)); if (!use) return null;
  const out = path.join(TMP, `${r.hash}.jpg`);
  try { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', use, '-vf', "scale='min(360,iw)':-2", '-q:v', '5', out]); } catch { return null; }
  return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
}
const MUSIC = /^\W*(\*[^*]*\*\s*)+\W*$|^\s*(you|thank you\.?( thank you\.?)*|bye\.?( bye\.?)*|music( music)*|one, two\.*|we'll see you next time\.)\s*$/i;
const voiceOf = r => (!r.transcript || MUSIC.test(r.transcript) || r.transcript.length < 25) ? null : r.transcript;
const screenOf = r => {
  if (!r.ocr || r.kind !== 'image') return null;
  const seen = new Set();
  const lines = r.ocr.split('\n').map(l => l.trim()).filter(l => { const k = l.toLowerCase().replace(/[^a-z]/g, ''); const letters = (l.match(/[a-z]/gi) || []).length;
    if (k.length < 8 || seen.has(k) || letters / l.length < 0.75) return false; seen.add(k); return true; });
  return lines.length ? lines.join(' / ') : null;
};
const bracketOf = r => r.bracket || 'branded';
const MERGED = rows.some(r => r.n_new != null);
const pill = (t, cls = '') => `<span class="pill ${cls}">${esc(t)}</span>`;

/* ---------- angles, concepts, picks ---------- */
const clean = rows.filter(r => r.status === 'clean');
const border = rows.filter(r => r.status === 'borderline');
const words = r => new Set(`${r.title || ''} ${r.body || ''}`.normalize('NFKC').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
const jac = (a, b) => { let i = 0; for (const w of a) if (b.has(w)) i++; return i / ((a.size + b.size - i) || 1); };
const angleNames = SECTIONS.filter(s => s.name.startsWith('Angle: ')).map(s => s.name.slice(7));
const ANGLES = angleNames.map((name, idx) => {
  const list = clean.filter(r => (r.review || {}).angle === name);
  const concepts = [];
  for (const r of list) { const w = words(r); const c = concepts.find(c => w.size >= 4 && c.w.size >= 4 && jac(w, c.w) >= 0.72); if (c) c.m.push(r); else concepts.push({ w, m: [r] }); }
  for (const c of concepts) {
    c.ads = c.m.reduce((s, r) => s + r.n_ads, 0); c.life = Math.max(...c.m.map(r => r.life));
    c.pages = new Set(c.m.flatMap(r => r.pages.map(p => p.pid))).size; c.proof = c.ads + 2 * (c.pages - 1);
    c.rep = [...c.m].sort((x, y) => (y.kind === 'video') - (x.kind === 'video') || (!!voiceOf(y)) - (!!voiceOf(x)) || y.n_ads - x.n_ads || y.life - x.life)[0];
  }
  concepts.sort((x, y) => y.proof - x.proof || y.life - x.life);
  const info = bulletMap(SECTIONS.find(s => s.name === 'Angle: ' + name).body);
  const pins = (info.Picks || '').split(/[,\s]+/).filter(Boolean);
  let picks, editorial = false;
  if (pins.length) { editorial = true; picks = pins.map(p => concepts.find(c => c.m.some(r => r.hash.startsWith(p)))).filter(Boolean); }
  else {
    const n = Math.min(3, concepts.length), seenPages = new Set(); picks = [];
    // one concept per advertiser; franchise pages share a brand name prefix (Miracle Method, Re-Bath …)
    const brand = r => r.page.toLowerCase().replace(/\s+(of|-|–)\s+.*$/, '').split(/\s+/).slice(0, 2).join(' ');
    const distinctPages = new Set(list.map(brand)).size;
    for (const c of concepts) { if (picks.length >= n) break; if (distinctPages >= n && seenPages.has(brand(c.rep))) continue; picks.push(c); seenPages.add(brand(c.rep)); }
    for (const c of concepts) { if (picks.length >= n) break; if (!picks.includes(c)) picks.push(c); }
  }
  const flat = concepts.every(c => c.ads <= 1 && c.pages <= 1);
  return { idx, name, list, concepts, picks, editorial, flat, info,
    ads: list.reduce((s, r) => s + r.n_ads, 0), pages: new Set(list.map(r => r.pid)).size, medLife: med(list.map(r => r.life)),
    kinds: list.reduce((m, r) => (m[r.kind] = (m[r.kind] || 0) + 1, m), {}),
    brackets: list.reduce((m, r) => (m[bracketOf(r)] = (m[bracketOf(r)] || 0) + 1, m), {}) };
});
const untagged = clean.filter(r => !angleNames.includes((r.review || {}).angle));
if (untagged.length) { console.error(`${untagged.length} clean ads have no angle in REPORT.md: ${untagged.map(r => r.hash).join(', ')}`); process.exit(1); }

function card(c, rank, angle) {
  const r = c.rep, t = thumb(r), v = voiceOf(r), sc = screenOf(r);
  const hook = r.title && r.body && !r.body.startsWith(r.title) ? r.title : '';
  const why = angle.editorial ? 'Editorial pick: no ad in this angle has scale proof'
    : c.proof > 1 ? `${rank === 1 ? 'Most duplicated in this angle' : 'Proof'}: ${c.ads} live ad${c.ads > 1 ? 's' : ''}${c.pages > 1 ? ` on ${c.pages} pages` : ''}${c.m.length > 1 ? ` (${c.m.length} copy variants)` : ''}`
    : 'Single ad; ranked by days live';
  return `<div class="card">
    <div class="thumb">${t ? `<img src="${t}">` : '<div class="noimg">copy only<br>no media captured</div>'}<span class="kind">${esc(r.kind === 'copy-only' ? (r.fmt || 'copy') : r.kind)}</span><span class="rank">#${rank}</span></div>
    <div class="body">
      <div class="page">${esc(r.page)}</div>
      <div class="meta">${pill(bracketOf(r) === 'affiliate' ? 'marketplace / lead-gen' : 'branded', bracketOf(r))}<span class="facts">${c.life}d live · ${c.ads} live ad${c.ads > 1 ? 's' : ''}${MERGED && c.m.some(r => r.n_new) ? ` (${c.m.reduce((s, r) => s + (r.n_new || 0), 0)} new this week)` : ''} · ${c.pages} page${c.pages > 1 ? 's' : ''} · started ${esc(r.started || '—')}${r.cta ? ` · CTA “${esc(r.cta)}”` : ''}${r.domains[0] ? ` · ${esc(r.domains[0])}` : ''}</span></div>
      <div class="why">${esc(why)}</div>
      ${hook ? `<div class="hook"><span class="lbl">Headline</span><span>${esc(clip(hook, 110))}</span></div>` : ''}
      ${r.body ? `<div class="hook"><span class="lbl">Copy</span><span>${esc(clip(r.body, 300))}</span></div>` : ''}
      ${v ? `<div class="hook heard"><span class="lbl">Heard</span><span>“${esc(clip(v, 300))}”</span></div>` : (r.kind === 'video' ? `<div class="hook heard"><span class="lbl">Heard</span><em>music only, no voiceover</em></div>` : '')}
      ${sc ? `<div class="hook heard"><span class="lbl">On image</span><span>${esc(clip(sc, 150))}</span></div>` : ''}
      <div class="foot"><span class="rv">Checked: ${esc(r.media_checked)}</span><a href="${esc(r.link)}">Ad Library ↗</a></div>
    </div></div>`;
}

const judged = rows.filter(r => r.status !== 'off-vertical');
const cleanAds = clean.reduce((s, r) => s + r.n_ads, 0), cleanPages = new Set(clean.map(r => r.pid)).size;
const maxAds = Math.max(...ANGLES.map(a => a.ads));
const P = {};
for (const r of rows) for (const p of r.pages) { if (r.status === 'off-vertical') continue; const x = P[p.page] || (P[p.page] = { ads: 0, cre: 0, clean: 0 }); x.ads += p.ads; x.cre++; if (r.status === 'clean') x.clean++; }
const topPages = Object.entries(P).sort((a, b) => b[1].ads - a[1].ads).slice(0, 25);

const changed = SECTIONS.find(s => /^What changed/.test(s.name));
const NL = {};
if (MERGED) for (const r of rows) { if (r.status === 'off-vertical' || !r.n_new) continue; const x = NL[r.page] || (NL[r.page] = { ads: 0, cre: 0, clean: 0, cats: {} }); x.ads += r.n_new; x.cre++; if (r.status === 'clean') x.clean++; for (const k of new Set(r.reasons.filter(h => h.sev === 'hard').map(h => h.cat))) x.cats[k] = (x.cats[k] || 0) + 1; }
const newLaunchers = Object.entries(NL).sort((a, b) => b[1].ads - a[1].ads).slice(0, 12);
const formats = bulletMap(sec('Formats, CTAs and landing'));
const testItems = listItems(sec('Test plan'));

const css = `
@page { size: Letter; margin: 0.5in 0.55in 0.62in; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 9.4pt/1.45 -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1b1d22; }
h1, h2, h3 { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; letter-spacing: -0.01em; margin: 0; }
h2 { font-size: 18pt; font-weight: 720; margin: 0 0 4pt; }
h2 + .sub { color: #5d6270; margin: 0 0 11pt; font-size: 9.4pt; }
h3 { font-size: 10.6pt; font-weight: 650; margin: 12pt 0 6pt; break-after: avoid; }
p { margin: 0 0 7pt; }
a { color: #1f5fd6; text-decoration: none; }
code { font: 8.2pt ui-monospace, Menlo, monospace; background: #f1f2f5; padding: 0 2pt; border-radius: 2pt; }
.muted { color: #8a8f9c; }
.section { break-before: page; }
.eyebrow { font-size: 7.6pt; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #0f766e; margin-bottom: 5pt; }
.cover { height: 9.7in; display: flex; flex-direction: column; }
.cover .brand { font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; color: #6b7080; font-weight: 700; }
.cover h1 { font-size: 34pt; line-height: 1.05; font-weight: 750; margin: 1.0in 0 10pt; }
.cover .date { font-size: 11.5pt; color: #4b5060; }
.chips { margin-top: 14pt; } .chips span { display: inline-block; font-size: 8.8pt; font-weight: 650; padding: 3pt 9pt; border-radius: 99pt; background: #e7f5f3; color: #0f5f58; margin: 0 5pt 5pt 0; }
.chips span.ok { background: #eef0f4; color: #3f4453; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; margin: 26pt 0 22pt; }
.stat { border-top: 2.5px solid #1b1d22; padding-top: 7pt; }
.stat .n { font-size: 21pt; font-weight: 700; letter-spacing: -0.02em; }
.stat .l { font-size: 8pt; color: #5d6270; margin-top: 1pt; }
.stat.hot { border-color: #0f766e; } .stat.hot .n { color: #0f766e; }
.headline { background: #eef8f6; border-left: 3.5px solid #0f766e; padding: 12pt 14pt; font-size: 10.8pt; line-height: 1.5; }
.toc { margin-top: 16pt; font-size: 8.8pt; color: #33384a; columns: 2; column-gap: 18pt; } .toc div { margin-bottom: 2.5pt; break-inside: avoid; }
.note { margin-top: auto; font-size: 8.2pt; color: #6b7080; border-top: 1px solid #e3e5ea; padding-top: 8pt; }
ol.read { padding-left: 0; list-style: none; counter-reset: r; margin: 0; }
ol.read li { counter-increment: r; position: relative; padding: 0 0 9pt 28pt; break-inside: avoid; }
ol.read li::before { content: counter(r); position: absolute; left: 0; top: 0; width: 19pt; height: 19pt; border-radius: 50%; background: #1b1d22; color: #fff; font-weight: 700; font-size: 9pt; display: grid; place-items: center; }
.bar { height: 7pt; background: #0f766e; border-radius: 2pt; opacity: .85; }
.statrow { display: flex; flex-wrap: wrap; gap: 6pt; margin: 2pt 0 10pt; }
.statrow span { font-size: 8.2pt; background: #f3f4f7; border-radius: 4pt; padding: 3pt 7pt; color: #33384a; } .statrow b { color: #1b1d22; }
.analysis { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 16pt; margin-bottom: 8pt; }
.analysis .item { break-inside: avoid; } .analysis .full { grid-column: 1 / -1; }
.analysis .k { font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0f766e; margin-bottom: 1.5pt; }
.analysis .v { font-size: 9pt; line-height: 1.45; }
.hooks { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; margin: 4pt 0 10pt; break-inside: avoid; }
.hooks > div { background: #f5f6f9; border-radius: 6pt; padding: 8pt 10pt; }
.hooks .k { font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7080; margin-bottom: 3pt; }
.hooks ul { margin: 0; padding-left: 11pt; } .hooks li { font-size: 8.7pt; margin-bottom: 3pt; line-height: 1.38; }
.cards { display: flex; flex-direction: column; gap: 7pt; }
.card { display: grid; grid-template-columns: 1.12in 1fr; gap: 10pt; border: 1px solid #e3e5ea; border-radius: 7pt; padding: 8pt; break-inside: avoid; }
.thumb { position: relative; background: #111318; border-radius: 4pt; height: 1.55in; overflow: hidden; display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.thumb .kind { position: absolute; left: 4pt; bottom: 4pt; background: rgba(0,0,0,.66); color: #fff; font-size: 6.2pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 1pt 3.5pt; border-radius: 3pt; }
.thumb .rank { position: absolute; left: 4pt; top: 4pt; background: #0f766e; color: #fff; font-size: 8pt; font-weight: 750; padding: 1pt 4.5pt; border-radius: 3pt; }
.noimg { color: #9aa0ab; font-size: 7.4pt; text-align: center; line-height: 1.3; }
.body { display: flex; flex-direction: column; min-width: 0; }
.page { font-size: 10.4pt; font-weight: 650; line-height: 1.2; }
.meta { margin-top: 3pt; } .facts { font-size: 7.8pt; color: #4b5060; }
.why { margin-top: 3pt; font-size: 7.8pt; font-weight: 600; color: #0f5f58; }
.hook { margin-top: 4pt; font-size: 8.7pt; line-height: 1.36; display: grid; grid-template-columns: 46pt 1fr; }
.hook .lbl { font-size: 6.6pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #8a8f9c; padding-top: 1.6pt; }
.hook.heard { color: #33384a; }
.foot { margin-top: auto; padding-top: 5pt; display: flex; justify-content: space-between; align-items: end; gap: 8pt; }
.rv { font-size: 7pt; color: #8a8f9c; } .foot a { font-size: 8pt; font-weight: 600; white-space: nowrap; }
.pill { display: inline-block; font-size: 6.9pt; font-weight: 650; padding: 1pt 5pt; border-radius: 99pt; background: #eef0f4; color: #3f4453; margin: 0 4pt 2pt 0; white-space: nowrap; }
.pill.branded { background: #e6eefc; color: #1e4fae; } .pill.affiliate { background: #fdf3d8; color: #8a5a00; }
table { width: 100%; border-collapse: collapse; font-size: 8.1pt; margin: 4pt 0 8pt; font-variant-numeric: tabular-nums; }
th { text-align: left; font-size: 6.9pt; letter-spacing: .06em; text-transform: uppercase; color: #6b7080; font-weight: 700; border-bottom: 1.5px solid #1b1d22; padding: 4pt 5pt; }
td { border-bottom: 1px solid #eceef2; padding: 3.4pt 5pt; vertical-align: top; }
td.r, th.r { text-align: right; } tr { break-inside: avoid; } td:last-child { white-space: nowrap; }
tr.grp td { background: #eef8f6; font-weight: 650; color: #0f5f58; }
.hi td { background: #eef8f6; }
.twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
.callout { background: #f5f6f9; border-radius: 6pt; padding: 8pt 10pt; margin: 6pt 0; break-inside: avoid; font-size: 8.6pt; }
.callout > b:first-child { display: block; margin-bottom: 2pt; }
ul.rules { padding-left: 14pt; margin: 0; } ul.rules li { margin-bottom: 7pt; }
.warn { background: #fff4ec; border-left: 3px solid #c2410c; padding: 7pt 10pt; font-size: 8.8pt; margin-top: 6pt; }
`;

const splitQuotes = s => (s || '').split(/\s+·\s+/).map(x => x.trim()).filter(Boolean);
const angleSection = (a, i) => {
  const I = a.info;
  const kinds = Object.entries(a.kinds).map(([k, v]) => `${v} ${k}`).join(' · ');
  return `<section class="section">
  <div class="eyebrow">Angle ${i + 1} of ${ANGLES.length}</div><h2>${esc(a.name)}</h2>
  <div class="statrow"><span><b>${a.list.length}</b> creatives</span><span><b>${a.ads}</b> live ads</span><span><b>${a.pages}</b> page${a.pages > 1 ? 's' : ''}</span><span>median <b>${a.medLife}d</b> live</span><span>${esc(kinds)}</span>${a.brackets.affiliate ? `<span>${a.brackets.affiliate} marketplace / lead-gen</span>` : ''}</div>
  <div class="analysis">
    <div class="item"><div class="k">Emotional trigger</div><div class="v">${inline(I.Trigger)}</div></div>
    <div class="item"><div class="k">What it is</div><div class="v">${inline(I['What it is'])}</div></div>
    <div class="item full"><div class="k">Who runs it</div><div class="v">${inline(I['Who runs it'])}</div></div>
    <div class="item"><div class="k">Why it works</div><div class="v">${inline(I['Why it works'])}</div></div>
    <div class="item"><div class="k">How to use it</div><div class="v">${inline(I['How to use it'])}</div></div>
  </div>
  <div class="hooks">
    <div><div class="k">Copy hooks (what they read)</div><ul>${splitQuotes(I['Copy hooks']).map(q => `<li>${inline(q)}</li>`).join('')}</ul></div>
    <div><div class="k">Video hooks (what they hear)</div><ul>${splitQuotes(I['Video hooks']).map(q => `<li>${inline(q)}</li>`).join('')}</ul></div>
  </div>
  ${I['Watch out'] ? `<div class="warn"><b>Watch out:</b> ${inline(I['Watch out'])}</div>` : ''}
  <h3>Top ${a.picks.length} ad${a.picks.length > 1 ? 's' : ''} <span class="muted">· ${a.editorial ? 'editorial picks, no ad here has scale proof' : a.flat ? 'no ad here runs more than once; ranked by days live' : `ranked by duplication across ${a.concepts.length} distinct concepts`}</span></h3>
  <div class="cards">${a.picks.map((c, k) => card(c, k + 1, a)).join('')}</div>
</section>`;
};

const labels = Object.entries(summary.excluded_by_label).slice(0, 16);
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(LABEL)} compliant angles ${DATE}</title><style>${css}</style></head><body>
<section class="cover">
  <div class="brand">AdLibraryResearch research · Meta Ad Library</div>
  <h1>${esc(LABEL)}:<br>Compliant Angles</h1>
  <div class="date">${esc(argv['data-label'] || `Active US ads harvested ${DATE}`)} · analysed ${TODAY}</div>
  <div class="chips"><span>No pricing</span><span>No government or program angle</span><span>No free products</span><span class="ok">Free estimate / quote / consultation OK</span></div>
  <div class="stats">
    <div class="stat hot"><div class="n">${clean.length}</div><div class="l">compliant creatives · ${cleanAds} live ads · ${cleanPages} pages</div></div>
    <div class="stat"><div class="n">${ANGLES.length}</div><div class="l">angles, top 2–3 ads each</div></div>
    <div class="stat"><div class="n">${n0(judged.length)}</div><div class="l">remodeling creatives judged</div></div>
    <div class="stat"><div class="n">${(clean.length / judged.length * 100).toFixed(0)}%</div><div class="l">pass rate</div></div>
  </div>
  <div class="headline">${inline(sec('Headline'))}</div>
  <div class="toc">${['The read', ...(changed ? [changed.name] : []), 'Angle map', ...ANGLES.map((a, i) => `Angle ${i + 1}: ${a.name}`), 'Formats, CTAs & landing · Test plan', 'Appendix A: Rules & method', `Appendix B: All ${clean.length} compliant ads`, `Appendix C: ${border.length} borderline ads`, 'Appendix D: Why the rest were excluded'].map(t => `<div>${esc(t)}</div>`).join('')}</div>
  <div class="note">Every surface was checked (headline, body, caption, landing URL, page name, full voiceover, and on-screen text across the whole video), and every passing ad was read by hand. ${n0(summary.unreadable_dco_ads)} dynamic-creative ads show only template placeholders and could not be judged.</div>
</section>

<section class="section">
  <div class="eyebrow">Section 1</div><h2>The read</h2><div class="sub">What sells bathroom remodeling without a price, a program or a free product, and who is scaling it.</div>
  <ol class="read">${listItems(sec('The read')).map(t => `<li>${inline(t)}</li>`).join('')}</ol>
</section>


${changed ? `<section class="section">
  <div class="eyebrow">Section 1b</div><h2>${esc(changed.name)}</h2><div class="sub">New launches, what blocks them, and which compliant ads are new.</div>
  <ol class="read">${listItems(changed.body).map(t => `<li>${inline(t)}</li>`).join('')}</ol>
  ${newLaunchers.length ? `<h3>Biggest launchers since the last full pull</h3><table><thead><tr><th>Page</th><th class="r">New ads</th><th class="r">New creatives</th><th class="r">Compliant</th><th>Blocked by</th></tr></thead><tbody>
  ${newLaunchers.map(([p, v]) => `<tr${v.clean ? ' class="hi"' : ''}><td>${esc(clip(p, 40))}</td><td class="r">${v.ads}</td><td class="r">${v.cre}</td><td class="r">${v.clean}</td><td>${esc(Object.entries(v.cats).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '))}</td></tr>`).join('')}
  </tbody></table>` : ''}
</section>` : ''}
<section class="section">
  <div class="eyebrow">Section 2</div><h2>Angle map</h2><div class="sub">All ${ANGLES.length} angles in the compliant set, ordered from strongest model to weakest default. Bars show live ads.</div>
  <table><thead><tr><th>#</th><th style="width:2.05in">Angle</th><th class="r">Creatives</th><th class="r">Live ads</th><th style="width:1.1in"></th><th class="r">Pages</th><th class="r">Median life</th><th>Strongest concept</th></tr></thead><tbody>
  ${ANGLES.map((a, i) => { const c = a.concepts[0]; return `<tr><td>${i + 1}</td><td><b>${esc(a.name)}</b></td><td class="r">${a.list.length}</td><td class="r">${a.ads}</td><td><div class="bar" style="width:${Math.max(4, a.ads / maxAds * 100).toFixed(0)}%"></div></td><td class="r">${a.pages}</td><td class="r">${a.medLife}d</td><td>${c ? `${esc(clip(c.rep.page, 24))} <span class="muted">· ${c.ads} ad${c.ads > 1 ? 's' : ''}${c.pages > 1 ? ` · ${c.pages} pages` : ''} · ${c.life}d</span>` : ''}</td></tr>`; }).join('')}
  </tbody></table>
  <div class="twocol">
    <div class="callout"><b>Where the proof is</b>Only ${ANGLES.filter(a => a.concepts[0] && a.concepts[0].proof >= 3).length} angles have a concept running on 3+ ads or several pages: ${ANGLES.filter(a => a.concepts[0] && a.concepts[0].proof >= 3).map(a => esc(a.name)).join(', ')}.</div>
    <div class="callout"><b>Brackets</b>${clean.filter(r => bracketOf(r) === 'branded').length} branded contractor creatives, ${clean.filter(r => bracketOf(r) === 'affiliate').length} marketplace / lead-gen (Thumbtack, ICT Home Pros, search arbitrage). The aggressive affiliate bracket has effectively no compliant ads; its whole model is price, program or free.</div>
  </div>
</section>

${ANGLES.map(angleSection).join('\n')}

<section class="section">
  <div class="eyebrow">Section 3</div><h2>Formats, CTAs and landing</h2><div class="sub">How the compliant set is built and where it sends people.</div>
  <ul class="rules">${Object.entries(formats).map(([k, v]) => `<li><b>${esc(k)}:</b> ${inline(v)}</li>`).join('')}</ul>
  <h3>Test plan</h3>
  <ol class="read">${testItems.filter((t, i, all) => /^\*\*/.test(t) && !/^\*\*Words/.test(t)).map(t => `<li>${inline(t)}</li>`).join('')}</ol>
  ${testItems.filter(t => /^\*\*Words/.test(t)).map(t => `<div class="warn">${inline(t)}</div>`).join('')}
</section>

<section class="section">
  <div class="eyebrow">Appendix A</div><h2>Rules and method</h2><div class="sub">What counts as pricing, government and free; what was checked; how the top ads were picked.</div>
  <ul class="rules">${listItems(sec('Rules')).map(t => `<li>${inline(t)}</li>`).join('')}</ul>
  <table><thead><tr><th>Status</th><th class="r">Creatives</th><th>Meaning</th></tr></thead><tbody>
    <tr class="hi"><td><b>Compliant</b></td><td class="r">${clean.length}</td><td>No pricing, government or free product anywhere. Appendix B.</td></tr>
    <tr><td>Borderline</td><td class="r">${border.length}</td><td>Only soft words (affordable, budget, home value, “Get offer” button). Appendix C.</td></tr>
    <tr><td>Excluded</td><td class="r">${n0(summary.status.excluded || 0)}</td><td>Pricing, government or free-product hit. Appendix D.</td></tr>
    <tr><td>Not bathroom remodeling</td><td class="r">${summary.status['off-vertical'] || 0}</td><td>Products, Amazon finds, realtor listings, supplements that mention a bathroom.</td></tr>
    <tr><td>Not judgeable (DCO)</td><td class="r">${n0(summary.unreadable_dco_ads)} ads</td><td>Dynamic creative with template placeholders instead of copy.</td></tr>
  </tbody></table>
</section>

<section class="section">
  <div class="eyebrow">Appendix B</div><h2>All ${clean.length} compliant ads</h2><div class="sub">The complete list by angle. Top-ranked concepts are marked ★.</div>
  <table><thead><tr><th>Page</th><th>Hook</th><th>Format</th><th class="r">Life</th><th class="r">Ads</th>${MERGED ? '<th class="r">New</th>' : ''}<th></th></tr></thead><tbody>
  ${ANGLES.map(a => { const top = new Set(a.picks.flatMap(c => c.m.map(r => r.hash)));
    return `<tr class="grp"><td colspan="${MERGED ? 7 : 6}">${esc(a.name)} · ${a.list.length}</td></tr>` + [...a.list].sort((x, y) => y.n_ads - x.n_ads || y.life - x.life).map(r =>
      `<tr><td>${top.has(r.hash) ? '★ ' : ''}${esc(clip(r.page, 32))}</td><td>${esc(clip((r.title && r.title.trim() !== r.page.trim() ? r.title : '') || r.copy_hook || voiceOf(r) || '(no copy)', 78))}</td><td>${esc(r.kind)}</td><td class="r">${r.life}d</td><td class="r">${r.n_ads}</td>${MERGED ? `<td class="r">${r.n_new || ''}</td>` : ''}<td><a href="${esc(r.link)}">ad ↗</a></td></tr>`).join(''); }).join('')}
  </tbody></table>
</section>

<section class="section">
  <div class="eyebrow">Appendix C</div><h2>Borderline: ${border.length} ads with soft money words only</h2><div class="sub">No price, program or free product, but they lean on “affordable”, “budget” or similar. Your call.</div>
  <table><thead><tr><th>Page</th><th>Hook</th><th>Flagged</th><th class="r">Life</th><th class="r">Ads</th><th></th></tr></thead><tbody>
  ${[...border].sort((a, b) => a.page.localeCompare(b.page) || b.life - a.life).map(r => `<tr><td>${esc(clip(r.page, 30))}</td><td>${esc(clip(r.title || r.copy_hook, 64))}</td><td>${esc([...new Set(r.reasons.filter(h => h.sev === 'soft').map(h => `“${clip(h.match, 24)}”`))].join(', ') || esc((r.review || {}).why || ''))}</td><td class="r">${r.life}d</td><td class="r">${r.n_ads}</td><td><a href="${esc(r.link)}">ad ↗</a></td></tr>`).join('')}
  </tbody></table>
</section>

<section class="section">
  <div class="eyebrow">Appendix D</div><h2>Why the rest were excluded</h2><div class="sub">${n0(summary.status.excluded || 0)} excluded creatives. One creative usually trips several rules.</div>
  <div class="twocol">
    <div><h3>By rule</h3><table><thead><tr><th>Rule</th><th class="r">Creatives</th></tr></thead><tbody>
      ${labels.map(([l, c]) => `<tr><td>${esc(l)}</td><td class="r">${n0(c)}</td></tr>`).join('')}</tbody></table>
      <p class="muted">Pricing ${n0(summary.excluded_by_category.pricing)} · government ${n0(summary.excluded_by_category.government)} · free product ${n0(summary.excluded_by_category.free)}</p></div>
    <div><h3>The 25 biggest advertisers</h3><table><thead><tr><th>Page</th><th class="r">Ads</th><th class="r">Creatives</th><th class="r">Compliant</th></tr></thead><tbody>
      ${topPages.map(([p, v]) => `<tr${v.clean ? ' class="hi"' : ''}><td>${esc(clip(p, 34))}</td><td class="r">${v.ads}</td><td class="r">${v.cre}</td><td class="r">${v.clean}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <h3>Dynamic-creative ads that could not be judged</h3>
  <p>${Object.entries(summary.unreadable_pages).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([p, c]) => `${esc(p.trim())} ${c}`).join(' · ')}</p>
</section>
</body></html>`;

const htmlPath = path.join(DIR, `compliant-angles-${DATE}.html`);
fs.writeFileSync(htmlPath, html);

// isolated headless Chrome: writes the PDF but never exits on macOS, so wait for the file to settle, then kill
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const raw = path.join(TMP, 'raw.pdf');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-print-profile-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--use-mock-keychain',
  '--password-store=basic', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  '--no-pdf-header-footer', `--print-to-pdf=${raw}`, 'file://' + htmlPath], { stdio: 'ignore', detached: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = -1, stable = 0; const deadline = Date.now() + 180000;
while (Date.now() < deadline) {
  await sleep(1000);
  const size = fs.existsSync(raw) ? fs.statSync(raw).size : 0;
  if (size > 0 && size === last) { if (++stable >= 2) break; } else stable = 0;
  last = size;
}
try { process.kill(-chrome.pid, 'SIGTERM'); } catch { try { chrome.kill('SIGTERM'); } catch {} }
await sleep(500);
fs.rmSync(profile, { recursive: true, force: true });
if (!fs.existsSync(raw) || fs.statSync(raw).size === 0) { console.error('Chrome produced no PDF'); process.exit(1); }

const py = `
import io, sys
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
r = PdfReader(sys.argv[1]); w = PdfWriter(); n = len(r.pages)
for i, p in enumerate(r.pages):
    W, H = float(p.mediabox.width), float(p.mediabox.height)
    if i > 0:
        b = io.BytesIO(); c = canvas.Canvas(b, pagesize=(W, H)); c.setFont("Helvetica", 7.5); c.setFillColor(HexColor("#8a8f9c"))
        c.drawString(40, 22, sys.argv[3]); c.drawRightString(W - 40, 22, f"{i+1} / {n}"); c.save(); b.seek(0)
        p.merge_page(PdfReader(b).pages[0])
    w.add_page(p)
w.add_metadata({"/Title": sys.argv[3], "/Author": "AdLibraryResearch research", "/Subject": "Meta Ad Library compliant angles"})
with open(sys.argv[2], "wb") as f: w.write(f)
print(n)
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const pages = execFileSync('python3', ['-c', py, raw, OUT, `${LABEL}: Compliant Angles · Meta Ad Library · ${DATE}`]).toString().trim();
fs.rmSync(TMP, { recursive: true, force: true });
fs.copyFileSync(OUT, path.join(DIR, path.basename(OUT)));
console.log(JSON.stringify({ ok: true, out: OUT, pages: +pages, bytes: fs.statSync(OUT).size, clean: clean.length, angles: ANGLES.map(a => [a.name, a.list.length, a.picks.map(c => `${c.rep.page} (${c.ads} ads/${c.pages}p/${c.life}d)`)]), html: htmlPath }, null, 1));
