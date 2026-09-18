#!/usr/bin/env node
/* clean-ads-pdf.mjs — render <run>/clean-ads/ (from clean-ads.mjs) into one PDF:
 * cover, the read, rules, every clean ad as a card (grouped by angle), borderline ads,
 * near-misses that fail only on a "free estimate/quote" line, why the rest failed,
 * and the clean ads' voiceover scripts.
 *
 * Narrative comes from <run>/clean-ads/REPORT.md sections "## The read", "## Rules", "## Handoff".
 * Angle and bracket per ad come from review.json ("angle", "bracket").
 *
 * Usage: node clean-ads-pdf.mjs --niche bathroom-remodeling --date 2026-09-13 [--root <p>] [--store <p>] [--out <pdf>]
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
const CFG = loadNiche(NICHE);
const LABEL = (CFG.label || NICHE).split('/')[0].trim();
const TODAY = new Date().toISOString().slice(0, 10);
const OUT = (argv.out || path.join(os.homedir(), 'Downloads', `${NICHE.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-')}-Clean-Ads-${TODAY}.pdf`)).replace(/^~/, os.homedir());
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-pdf-'));

const { rows, summary } = JSON.parse(fs.readFileSync(path.join(DIR, 'clean-ads.json'), 'utf8'));
const MD = fs.readFileSync(path.join(DIR, 'REPORT.md'), 'utf8');
const section = name => { const m = MD.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`)); return m ? m[1].trim() : ''; };

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const n0 = v => Number(v).toLocaleString('en-US');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
const listItems = md => md.split('\n').filter(l => /^(\d+\.|-)\s/.test(l)).map(l => l.replace(/^(\d+\.|-)\s+/, ''));

function thumb(r) {
  const cands = r.kind === 'image' ? [path.join(STORE, '_creatives', `${r.hash}.jpg`)]
    : r.kind === 'video' ? ['t1.5', 't3', 't0.5'].map(t => path.join(STORE, '_frames', `${r.hash}-${t}.jpg`)) : [];
  const use = cands.find(f => fs.existsSync(f)); if (!use) return null;
  const out = path.join(TMP, `${r.hash}.jpg`);
  try { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', use, '-vf', "scale='min(360,iw)':-2", '-q:v', '5', out]); } catch { return null; }
  return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
}
const MUSIC = /^\W*(\*[^*]*\*\s*)+\W*$|^\s*(you|thank you\.?|bye\.?( bye\.?)*|music( music)*|one, two\.*|we'll see you next time\.)\s*$/i;
const voiceOf = r => (!r.transcript || MUSIC.test(r.transcript) || r.transcript.length < 25) ? null : r.transcript;
const screenOf = r => {
  if (!r.ocr || r.kind !== 'image') return null;
  const seen = new Set();
  const lines = r.ocr.split('\n').map(l => l.trim()).filter(l => { const k = l.toLowerCase().replace(/[^a-z]/g, ''); const letters = (l.match(/[a-z]/gi) || []).length;
    if (k.length < 5 || seen.has(k) || letters / l.length < 0.75) return false; seen.add(k); return true; });
  return lines.length ? lines.join(' / ') : null;
};
const pill = (t, cls = '') => `<span class="pill ${cls}">${esc(t)}</span>`;
const bracketOf = r => r.bracket || 'branded';

function card(r, extra = '') {
  const t = thumb(r), v = voiceOf(r), sc = screenOf(r), a = (r.review || {}).angle;
  const hook = r.title && r.body && !r.body.startsWith(r.title) ? r.title : '';
  return `<div class="card">
    <div class="thumb">${t ? `<img src="${t}">` : '<div class="noimg">copy only<br>no media captured</div>'}<span class="kind">${esc(r.kind === 'copy-only' ? (r.fmt || 'copy') : r.kind)}</span></div>
    <div class="body">
      <div class="page">${esc(r.page)}${r.n_pages > 1 ? ` <span class="muted">+${r.n_pages - 1} pages</span>` : ''}</div>
      <div class="meta">${pill(bracketOf(r) === 'affiliate' ? 'marketplace / search-arb' : 'branded contractor', bracketOf(r))}${a ? pill(a, 'angle') : ''}
        <span class="facts">${r.life}d live · ${r.n_ads} ad${r.n_ads > 1 ? 's' : ''} · started ${esc(r.started || '—')}${r.cta ? ` · CTA “${esc(r.cta)}”` : ''}${r.domains[0] ? ` · ${esc(r.domains[0])}` : ''}</span></div>
      ${hook ? `<div class="hook"><span class="lbl">Headline</span><span>${esc(clip(hook, 110))}</span></div>` : ''}
      ${r.body ? `<div class="hook"><span class="lbl">Copy</span><span>${esc(clip(r.body, 260))}</span></div>` : ''}
      ${v ? `<div class="hook heard"><span class="lbl">Heard</span><span>“${esc(clip(v, 230))}”</span></div>` : (r.kind === 'video' ? `<div class="hook heard"><span class="lbl">Heard</span><em>music only, no voiceover</em></div>` : '')}
      ${sc ? `<div class="hook heard"><span class="lbl">On image</span><span>${esc(clip(sc, 150))}</span></div>` : ''}
      ${extra}
      <div class="foot"><span class="rv">Checked: ${esc(r.media_checked)}</span><a href="${esc(r.link)}">Ad Library ↗</a></div>
    </div></div>`;
}

const clean = rows.filter(r => r.status === 'clean');
const border = rows.filter(r => r.status === 'borderline');
const ANGLE_ORDER = ['DIY frustration → hire a pro', 'Safety / aging in place', 'Customer testimonial / referral', 'Local trust / heritage / awards', 'Speed (1-day install)', 'Pain-point opener', 'Project showcase / tour', 'Process / one point of contact', 'Education / expertise', 'Service list / capability'];
const byAngle = list => {
  const g = new Map(); for (const r of list) { const a = (r.review || {}).angle || 'Other'; if (!g.has(a)) g.set(a, []); g.get(a).push(r); }
  return [...g.entries()].sort((x, y) => (ANGLE_ORDER.indexOf(x[0]) + 99) % 99 - (ANGLE_ORDER.indexOf(y[0]) + 99) % 99)
    .map(([a, l]) => [a, l.sort((x, y) => y.n_ads - x.n_ads || y.life - x.life)]);
};
const branded = clean.filter(r => bracketOf(r) !== 'affiliate'), aff = clean.filter(r => bracketOf(r) === 'affiliate');

// near-misses: excluded ONLY by a "free estimate / quote / consultation" line
const EST = /free\W*(in-home |on-site |design |project |remodel(ing)? |shower remodel |bathroom |kitchen & bathroom renovation |no-obligation |3d design and )?(estimates?|quotes?|consult\w*)|consultations are free|estimates free|free remodel quotes|PREE ESTIMATES/i;
const near = rows.filter(r => r.status === 'excluded').filter(r => {
  const h = r.reasons.filter(x => x.sev === 'hard');
  return h.length && h.every(x => x.cat === 'free' && (EST.test(x.snippet) || EST.test((r.review || {}).why || '')));
}).sort((a, b) => a.page.localeCompare(b.page) || b.life - a.life);

// the biggest advertisers and how many clean creatives each has
const P = {};
for (const r of rows) for (const p of r.pages) { const x = P[p.page] || (P[p.page] = { ads: 0, cre: 0, clean: 0 }); if (r.status === 'off-vertical') continue; x.ads += p.ads; x.cre++; if (r.status === 'clean') x.clean++; }
const topPages = Object.entries(P).sort((a, b) => b[1].ads - a[1].ads).slice(0, 25);
const judged = rows.filter(r => r.status !== 'off-vertical');
const cleanAds = clean.reduce((s, r) => s + r.n_ads, 0), cleanPages = new Set(clean.map(r => r.pid)).size;
const pct = (judged.length ? clean.length / judged.length * 100 : 0).toFixed(0);
const scripts = clean.filter(r => voiceOf(r)).sort((a, b) => ANGLE_ORDER.indexOf((a.review || {}).angle) - ANGLE_ORDER.indexOf((b.review || {}).angle));
const readItems = listItems(section('The read'));

const css = `
@page { size: Letter; margin: 0.5in 0.55in 0.62in; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 9.4pt/1.45 -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1b1d22; }
h1, h2, h3 { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; letter-spacing: -0.01em; margin: 0; }
h2 { font-size: 17pt; font-weight: 700; margin: 0 0 4pt; }
h2 + .sub { color: #5d6270; margin: 0 0 12pt; font-size: 9.4pt; }
h3 { font-size: 11pt; font-weight: 650; margin: 14pt 0 6pt; break-after: avoid; }
h3 .muted { font-weight: 500; }
p { margin: 0 0 7pt; }
a { color: #1f5fd6; text-decoration: none; }
code { font: 8.2pt ui-monospace, Menlo, monospace; background: #f1f2f5; padding: 0 2pt; border-radius: 2pt; }
.muted { color: #8a8f9c; }
.section { break-before: page; }
.eyebrow { font-size: 7.6pt; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #0f766e; margin-bottom: 5pt; }
.cover { height: 9.7in; display: flex; flex-direction: column; }
.cover .brand { font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; color: #6b7080; font-weight: 700; }
.cover h1 { font-size: 34pt; line-height: 1.05; font-weight: 750; margin: 1.1in 0 10pt; }
.cover .date { font-size: 11.5pt; color: #4b5060; }
.chips { margin-top: 14pt; } .chips span { display: inline-block; font-size: 9pt; font-weight: 650; padding: 3pt 9pt; border-radius: 99pt; background: #e7f5f3; color: #0f5f58; margin-right: 5pt; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; margin: 30pt 0 24pt; }
.stat { border-top: 2.5px solid #1b1d22; padding-top: 7pt; }
.stat .n { font-size: 21pt; font-weight: 700; letter-spacing: -0.02em; }
.stat .l { font-size: 8pt; color: #5d6270; margin-top: 1pt; }
.stat.hot { border-color: #0f766e; } .stat.hot .n { color: #0f766e; }
.headline { background: #eef8f6; border-left: 3.5px solid #0f766e; padding: 12pt 14pt; font-size: 10.8pt; line-height: 1.5; }
.note { margin-top: auto; font-size: 8.2pt; color: #6b7080; border-top: 1px solid #e3e5ea; padding-top: 8pt; }
ol.read { padding-left: 0; list-style: none; counter-reset: r; margin: 0; }
ol.read li { counter-increment: r; position: relative; padding: 0 0 10pt 28pt; break-inside: avoid; }
ol.read li::before { content: counter(r); position: absolute; left: 0; top: 0; width: 19pt; height: 19pt; border-radius: 50%; background: #1b1d22; color: #fff; font-weight: 700; font-size: 9pt; display: grid; place-items: center; }
ul.rules { padding-left: 14pt; margin: 0; } ul.rules li { margin-bottom: 7pt; }
.cards { display: flex; flex-direction: column; gap: 7pt; }
.card { display: grid; grid-template-columns: 1.12in 1fr; gap: 10pt; border: 1px solid #e3e5ea; border-radius: 7pt; padding: 8pt; break-inside: avoid; }
.thumb { position: relative; background: #111318; border-radius: 4pt; height: 1.5in; overflow: hidden; display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.thumb .kind { position: absolute; left: 4pt; bottom: 4pt; background: rgba(0,0,0,.66); color: #fff; font-size: 6.2pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 1pt 3.5pt; border-radius: 3pt; }
.noimg { color: #9aa0ab; font-size: 7.4pt; text-align: center; line-height: 1.3; }
.body { display: flex; flex-direction: column; min-width: 0; }
.page { font-size: 10.4pt; font-weight: 650; line-height: 1.2; }
.meta { margin-top: 3pt; } .facts { font-size: 7.8pt; color: #4b5060; }
.hook { margin-top: 4pt; font-size: 8.7pt; line-height: 1.36; display: grid; grid-template-columns: 46pt 1fr; }
.hook .lbl { font-size: 6.6pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #8a8f9c; padding-top: 1.6pt; }
.hook.heard { color: #33384a; }
.flag { margin-top: 4pt; font-size: 8pt; color: #9a3412; background: #fff4ec; padding: 2pt 5pt; border-radius: 3pt; }
.foot { margin-top: auto; padding-top: 5pt; display: flex; justify-content: space-between; align-items: end; gap: 8pt; }
.rv { font-size: 7pt; color: #8a8f9c; } .foot a { font-size: 8pt; font-weight: 600; white-space: nowrap; }
.pill { display: inline-block; font-size: 6.9pt; font-weight: 650; padding: 1pt 5pt; border-radius: 99pt; background: #eef0f4; color: #3f4453; margin: 0 3pt 2pt 0; white-space: nowrap; }
.pill.branded { background: #e6eefc; color: #1e4fae; } .pill.affiliate { background: #fdf3d8; color: #8a5a00; } .pill.angle { background: #e7f5f3; color: #0f5f58; }
table { width: 100%; border-collapse: collapse; font-size: 8.2pt; margin: 4pt 0 8pt; font-variant-numeric: tabular-nums; }
th { text-align: left; font-size: 7pt; letter-spacing: .06em; text-transform: uppercase; color: #6b7080; font-weight: 700; border-bottom: 1.5px solid #1b1d22; padding: 4pt 5pt; }
td { border-bottom: 1px solid #eceef2; padding: 3.6pt 5pt; vertical-align: top; }
td.r, th.r { text-align: right; } tr { break-inside: avoid; }
.hi td { background: #eef8f6; }
.twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
.callout { background: #f5f6f9; border-radius: 6pt; padding: 9pt 11pt; margin: 8pt 0; break-inside: avoid; }
.script { break-inside: avoid; border-top: 1px solid #e3e5ea; padding: 7pt 0; }
.script h4 { margin: 0 0 3pt; font-size: 9.4pt; }
.script p { font-size: 8.5pt; color: #33384a; line-height: 1.5; }
`;

const cardsByAngle = list => byAngle(list).map(([a, l]) => `<h3>${esc(a)} <span class="muted">· ${l.length}</span></h3><div class="cards">${l.map(r => card(r)).join('')}</div>`).join('');
const labels = Object.entries(summary.excluded_by_label).slice(0, 16);
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(LABEL)} clean ads ${DATE}</title><style>${css}</style></head><body>
<section class="cover">
  <div class="brand">AdLibraryResearch research · Meta Ad Library</div>
  <h1>Clean ${esc(LABEL)} Ads</h1>
  <div class="date">Active US ads harvested ${DATE} · filtered ${TODAY}</div>
  <div class="chips"><span>No pricing</span><span>No government or program angle</span><span>Nothing “free”</span></div>
  <div class="stats">
    <div class="stat"><div class="n">${n0(summary.ads_on_niche)}</div><div class="l">on-niche ads scanned</div></div>
    <div class="stat"><div class="n">${n0(judged.length)}</div><div class="l">remodeling creatives judged</div></div>
    <div class="stat hot"><div class="n">${clean.length}</div><div class="l">clean creatives · ${cleanAds} live ads · ${cleanPages} pages</div></div>
    <div class="stat"><div class="n">${pct}%</div><div class="l">pass rate</div></div>
  </div>
  <div class="headline">${readItems[1] ? inline(readItems[1]) : ''}</div>
  <div class="note">Every surface was checked: headline, body, caption, landing URL, page name, full voiceover and on-screen text, and each passing ad was then read by hand. ${border.length} borderline ads (soft money words only) and ${near.length} near-misses that fail only on a “free estimate” line are listed separately. ${n0(summary.unreadable_dco_ads)} dynamic-creative ads show only template placeholders and could not be judged.</div>
</section>

<section class="section">
  <div class="eyebrow">Section 1</div><h2>The read</h2><div class="sub">What the clean slice of this niche looks like, and what it means for a compliant account.</div>
  <ol class="read">${readItems.map(t => `<li>${inline(t)}</li>`).join('')}</ol>
</section>

<section class="section">
  <div class="eyebrow">Section 2</div><h2>The rules</h2><div class="sub">What counts as pricing, government and free, what was checked, and the limits.</div>
  <ul class="rules">${listItems(section('Rules')).map(t => `<li>${inline(t)}</li>`).join('')}</ul>
  <h3>Where every creative landed</h3>
  <table><thead><tr><th>Status</th><th class="r">Creatives</th><th>Meaning</th></tr></thead><tbody>
    <tr class="hi"><td><b>Clean</b></td><td class="r">${clean.length}</td><td>No pricing, government or free anywhere. Sections 3–4.</td></tr>
    <tr><td>Borderline</td><td class="r">${border.length}</td><td>Only soft words (affordable, budget, a “Get offer” button). Section 5.</td></tr>
    <tr><td>Excluded</td><td class="r">${n0(summary.status.excluded || 0)}</td><td>At least one pricing, government or free hit. Appendix B.</td></tr>
    <tr><td>Not bathroom remodeling</td><td class="r">${summary.status['off-vertical'] || 0}</td><td>Products, Amazon finds, realtor listings, supplements that mention a bathroom.</td></tr>
    <tr><td>Not judgeable (DCO)</td><td class="r">${n0(summary.unreadable_dco_ads)} ads</td><td>Dynamic creative with template placeholders instead of copy.</td></tr>
  </tbody></table>
</section>

<section class="section">
  <div class="eyebrow">Section 3</div><h2>Clean ads: branded contractors</h2><div class="sub">${branded.length} creatives, grouped by angle, strongest swipe material first.</div>
  ${cardsByAngle(branded)}
</section>

<section class="section">
  <div class="eyebrow">Section 4</div><h2>Clean ads: marketplaces and search arbitrage</h2><div class="sub">${aff.length} creatives from lead marketplaces and content-arbitrage pages.</div>
  ${cardsByAngle(aff)}
</section>

<section class="section">
  <div class="eyebrow">Section 5</div><h2>Borderline</h2><div class="sub">${border.length} creatives with no pricing, government or free claim, only a soft money word. Your call.</div>
  <div class="cards">${border.sort((a, b) => b.life - a.life).map(r => card(r, `<div class="flag">Flagged: ${esc([...new Set(r.reasons.map(h => `“${h.match}” (${h.field})`))].join(', '))}${(r.review || {}).why ? ` · ${esc(r.review.why)}` : ''}</div>`)).join('')}</div>
</section>

<section class="section">
  <div class="eyebrow">Appendix A</div><h2>Near-misses: excluded only for “free estimate”</h2><div class="sub">${near.length} creatives whose only problem is a free estimate, quote or consultation line. Remove that line and each one qualifies.</div>
  <table><thead><tr><th>Page</th><th>Hook</th><th>The “free” line</th><th class="r">Life</th><th class="r">Ads</th><th></th></tr></thead><tbody>
  ${near.map(r => { const h = r.reasons.find(x => x.sev === 'hard'); const m = (h.snippet.match(/.{0,38}free.{0,34}/i) || [h.snippet.slice(0, 70)])[0];
    return `<tr><td>${esc(clip(r.page, 30))}</td><td>${esc(clip(r.title || r.copy_hook, 70))}</td><td>…${esc(m.trim())}… <span class="muted">(${esc(h.field)})</span></td><td class="r">${r.life}d</td><td class="r">${r.n_ads}</td><td><a href="${esc(r.link)}">ad ↗</a></td></tr>`; }).join('')}
  </tbody></table>
</section>

<section class="section">
  <div class="eyebrow">Appendix B</div><h2>Why everything else was excluded</h2><div class="sub">${n0(summary.status.excluded || 0)} excluded creatives. One creative usually trips several rules.</div>
  <div class="twocol">
    <div><h3>By rule</h3><table><thead><tr><th>Rule</th><th class="r">Creatives</th></tr></thead><tbody>
      ${labels.map(([l, c]) => `<tr><td>${esc(l)}</td><td class="r">${n0(c)}</td></tr>`).join('')}</tbody></table>
      <p class="muted">Pricing ${n0(summary.excluded_by_category.pricing)} · government ${n0(summary.excluded_by_category.government)} · free ${n0(summary.excluded_by_category.free)}</p></div>
    <div><h3>The 25 biggest advertisers</h3><table><thead><tr><th>Page</th><th class="r">Ads</th><th class="r">Creatives</th><th class="r">Clean</th></tr></thead><tbody>
      ${topPages.map(([p, v]) => `<tr${v.clean ? ' class="hi"' : ''}><td>${esc(clip(p, 34))}</td><td class="r">${v.ads}</td><td class="r">${v.cre}</td><td class="r">${v.clean}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <h3>Dynamic-creative ads that could not be judged</h3>
  <p>${Object.entries(summary.unreadable_pages).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([p, c]) => `${esc(p.trim())} ${c}`).join(' · ')}</p>
</section>

<section class="section">
  <div class="eyebrow">Appendix C</div><h2>Voiceover scripts of the clean video ads</h2><div class="sub">${scripts.length} voiced clean ads. Borrow the structure, not the words.</div>
  ${scripts.map(r => `<div class="script"><h4>${esc(r.page)} <span class="muted">· ${esc((r.review || {}).angle || '')} · ${r.life}d · ${r.n_ads} ad${r.n_ads > 1 ? 's' : ''} · <a href="${esc(r.link)}">ad ↗</a></span></h4><p>${esc(clip(r.transcript, 1400))}</p></div>`).join('')}
  <div class="callout"><b>Next</b> ${listItems(section('Handoff')).map(inline).join(' ')}</div>
</section>
</body></html>`;

const htmlPath = path.join(DIR, `clean-ads-${DATE}.html`);
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
w.add_metadata({"/Title": sys.argv[3], "/Author": "AdLibraryResearch research", "/Subject": "Meta Ad Library clean-ads filter"})
with open(sys.argv[2], "wb") as f: w.write(f)
print(n)
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const pages = execFileSync('python3', ['-c', py, raw, OUT, `Clean ${LABEL} Ads · no price, no government, nothing free · ${DATE}`]).toString().trim();
fs.rmSync(TMP, { recursive: true, force: true });
fs.copyFileSync(OUT, path.join(DIR, path.basename(OUT)));
console.log(JSON.stringify({ ok: true, out: OUT, pages: +pages, bytes: fs.statSync(OUT).size, clean: clean.length, borderline: border.length, near_miss: near.length, html: htmlPath }, null, 2));
