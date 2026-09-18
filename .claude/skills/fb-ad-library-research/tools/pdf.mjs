#!/usr/bin/env node
/* Render the run into one designed PDF with ad thumbnails.
 * Run it LAST, after the agent has written REPORT.md: "The read" and "Handoff"
 * are taken from that run's REPORT.md, every other section is built from the
 * run's data files, so the PDF is correct for any niche and any week. Missing
 * inputs (no traffic, no sheet check) render as a one-line note, never stale text.
 * Saves to ~/Downloads and keeps a copy in the run folder as report-<date>.pdf.
 *   node pdf.mjs --niche roofing --date 2026-09-11 [--out ~/Downloads/x.pdf]
 * HTML -> headless Chrome (isolated throwaway profile, never the user's) ->
 * page numbers stamped afterwards with reportlab/pypdf.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { rankByAggressiveness, rankByRvert, activeDeviceWeights, AGGRESSIVE_TOP_N, lifeOf } from './rank.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE), RUN = path.join(BASE, '_reports', DATE);
const OUT = (argv.out || path.join(os.homedir(), 'Downloads', `${NICHE[0].toUpperCase() + NICHE.slice(1)}-Ad-Library-Report-${DATE}.pdf`)).replace(/^~/, os.homedir());
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adlib-pdf-'));

const J = f => JSON.parse(fs.readFileSync(path.join(RUN, f), 'utf8'));
const S = J('scored.json'), K = J('scripts.json'), A = J('analysis.json'), G = J('angles.json');
let LP = {}; try { for (const r of J('landing-paths.json').rows) LP[r.id] = r; } catch {}
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const n0 = v => Number(v).toLocaleString('en-US');

/* ---------- thumbnails: resize once, embed as base64 ---------- */
function thumb(x) {
  const src = x.kind === 'video' ? path.join(BASE, '_frames', `${x.hash}-t1.5.jpg`) : path.join(BASE, '_creatives', `${x.hash}.jpg`);
  const alt = path.join(BASE, '_frames', `${x.hash}-t3.jpg`);
  const use = fs.existsSync(src) ? src : (fs.existsSync(alt) ? alt : null);
  if (!use) return null;
  const out = path.join(TMP, `${x.hash}.jpg`);
  if (!fs.existsSync(out)) {
    try { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', use, '-vf', "scale='min(420,iw)':-2", '-q:v', '5', out]); }
    catch { return null; }
  }
  return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
}

const aggressive = S.filter(x => x.aggression > 0);
const topAgg = rankByAggressiveness(S, AGGRESSIVE_TOP_N);   // top 50 by aggressiveness, geo-swaps collapsed
const topRvert = rankByRvert(S, AGGRESSIVE_TOP_N);   // companion cut: top 50 by RVERT alone, geo-swaps collapsed
const fresh = S.filter(x => lifeOf(x) < 14 && x.family_coll >= 3).sort((a, b) => b.family_coll - a.family_coll);
const fresh20 = fresh.slice(0, 20);
const withDev = S.filter(x => x.aggression > 0), noDev = S.filter(x => !x.aggression);
const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const dupWith = mean(withDev.map(x => x.family_coll)).toFixed(1), dupWithout = mean(noDev.map(x => x.family_coll)).toFixed(1);

const pill = (t, cls = '') => `<span class="pill ${cls}">${esc(t)}</span>`;
const bucketPill = b => pill(b === 'unclassified' ? 'unclassified' : b, b);

function pathLine(x) {
  const r = LP[x.id]; if (!r) return '';
  if (r.native) return `<div class="hook path"><span class="lbl">Path</span><em>native Facebook lead form / Messenger</em></div>`;
  const flags = [r.bounced ? '<span class="flag">cloaked — bounces non-Facebook visitors to google.com</span>' : r.cloaked ? `<span class="flag">cloaked — other visitors land on ${esc(r.mobile.final_host)}</span>` : '',
    r.offer_mismatch ? `<span class="flag">roofing ad → ${esc(r.offer_mismatch)} offer</span>` : ''].filter(Boolean).join(' ');
  return `<div class="hook path"><span class="lbl">Path</span>${esc(r.pathway || '—')}${r.tracker ? ` <span class="muted">· ${esc(r.tracker)}</span>` : ''}${r.redirect_count ? ` <span class="muted">· ${r.redirect_count} redirect${r.redirect_count > 1 ? 's' : ''}</span>` : ''}${flags ? '<br>' + flags : ''}</div>`;
}

function card(x, i, mode) {
  const k = K[x.hash] || {}, t = thumb(x), r = x.rvert;
  const heard = x.kind === 'video' ? (k.voice ? `“${esc(clip(k.spoken_hook, 170))}”` : '<em>no voiceover</em>') : null;
  const ageLine = mode === 'fresh'
    ? `<b>${lifeOf(x)}d old</b> · <b>x${x.family_coll}</b> already`
    : `alive <b>${lifeOf(x)}d</b> · dup <b>x${x.geo_variants > 1 ? x.variants_dup_total : x.family_coll}</b>${x.geo_variants > 1 ? ` across ${x.geo_variants} geo variants` : ''}`;
  return `<article class="card">
    <div class="thumb">${t ? `<img src="${t}">` : '<div class="noimg">no preview</div>'}<span class="kind">${x.kind}</span></div>
    <div class="body">
      <div class="top"><span class="rank">${String(i + 1).padStart(2, '0')}</span>
        <div class="who"><div class="page">${esc(x.page)}</div>
          <div class="meta">${bucketPill(x.bucket)} ${ageLine}</div></div>
        ${mode === 'agg'
          ? `<div class="score"><div class="n">${x.aggressiveness}</div><div class="l">AGGRESSIVE</div></div>`
          : `<div class="score"><div class="n">${x.score}</div><div class="l">RVERT</div></div>`}</div>
      <div class="hook"><span class="lbl">Copy</span>“${esc(clip(x.copy_hook, 190))}”</div>
      ${heard ? `<div class="hook heard"><span class="lbl">Heard</span>${heard}</div>` : ''}
      ${pathLine(x)}
      <div class="foot">
        <div class="devs">${(x.devices || []).map(d => pill(d, 'dev')).join(' ') || '<span class="muted">no aggression device</span>'}</div>
        <div class="rv">${mode === 'agg' ? `RVERT ${x.score} · ` : ''}R ${r.R_real} · V ${r.V_value} · E ${r.E_energy} · Rk ${r.R_risk} · T ${r.T_time}${x.urgency > 1 ? ` · U ×${x.urgency}` : ''}</div>
        <a href="${esc(x.link)}">View in Ad Library ↗</a>
      </div>
    </div></article>`;
}

/* ---------- data tables ---------- */
const devTally = {}; for (const x of S) for (const d of x.devices || []) devTally[d] = (devTally[d] || 0) + 1;
const TR = /use (your|my) (house|home) to (trial|test)|looking for \d+ ?more homeowners|\d+ homeowners? needed|to (trial|test|participate|demo)|trial (this|their|our)|poppin.? roof|pop[- ]?on roof|pop in roof/i;
const trial = {}; for (const x of S) if (TR.test(`${x.body} ${x.title} ${(K[x.hash] || {}).text || ''}`)) {
  const t = trial[x.page] || (trial[x.page] = { n: 0, dup: 0, newest: 999 }); t.n++; t.dup += x.family_coll; t.newest = Math.min(t.newest, lifeOf(x)); }
const trialRows = Object.entries(trial).sort((a, b) => b[1].dup - a[1].dup);
const trialDup = trialRows.reduce((s, [, v]) => s + v.dup, 0);
const trig = (b, name) => (G.triggers[b].find(t => t.name === name) || {});
const ang = (b, name) => (G.angles[b].find(t => t.name === name) || {});
const aff = A.brackets.find(b => b.bucket === 'affiliate');
/* ---------- narrative comes from THIS run's REPORT.md, never hardcoded ---------- */
const NICHE_CFG = (() => { try { return JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'config', 'niches', `${NICHE}.json`), 'utf8')); } catch { return {}; } })();
const LABEL = NICHE_CFG.label || NICHE.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const REPORT_MD = (() => { try { return fs.readFileSync(path.join(RUN, 'REPORT.md'), 'utf8'); } catch { return ''; } })();
function mdSection(md, re) {
  const lines = md.split('\n'); const i = lines.findIndex(l => /^##\s/.test(l) && re.test(l.replace(/^##\s+(\d+[a-z]?\s*·\s*)?/i, '')));
  if (i < 0) return '';
  const j = lines.findIndex((l, k) => k > i && /^##\s/.test(l));
  return lines.slice(i + 1, j < 0 ? undefined : j).join('\n').trim();
}
function mdInline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(“"])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/(^|[\s(“"])_([^_\s][^_]*)_(?=[\s.,;:!?)”"]|$)/g, '$1<i>$2</i>');
}
function mdBlocks(md) {                       // paragraphs, ### headings, lists, simple tables, callout quotes
  const out = []; const lines = md.split('\n'); let i = 0;
  const cont = l => /^\s{2,}\S/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim() || /^---+$/.test(l.trim())) { i++; continue; }
    if (/^###\s/.test(l)) { out.push(`<h3>${mdInline(l.replace(/^###\s+/, ''))}</h3>`); i++; continue; }
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { if (!/^\|\s*:?-/.test(lines[i])) rows.push(lines[i].replace(/^\||\|$/g, '').split('|').map(c => c.trim())); i++; }
      out.push(`<table><thead><tr>${rows[0].map(c => `<th>${mdInline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${mdInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`); continue; }
    const li = l.match(/^(\s*)(\d+\.|[-*])\s+(.*)$/);
    if (li) { const ordered = /\d/.test(li[2]); const items = [];
      while (i < lines.length) {
        if (!lines[i].trim()) { let k = i; while (k < lines.length && !lines[k].trim()) k++;
          const nx = (lines[k] || '').match(/^(\s*)(\d+\.|[-*])\s+/); if (nx && /\d/.test(nx[2]) === ordered) { i = k; continue; } break; }
        const m = lines[i].match(/^(\s*)(\d+\.|[-*])\s+(.*)$/); if (!m || /\d/.test(m[2]) !== ordered) break;
        let t = m[3]; i++; while (i < lines.length && cont(lines[i]) && !/^\s*(\d+\.|[-*])\s/.test(lines[i])) { t += ' ' + lines[i].trim(); i++; }
        items.push(t); }
      out.push(`<${ordered ? 'ol' : 'ul'} class="${ordered ? 'read' : 'tight'}">${items.map(t => `<li>${ordered ? mdInline(t).replace(/^<b>([^<]+)<\/b>\s*/, '<b class="t">$1</b>') : mdInline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`); continue; }
    if (/^>/.test(l)) { let t = ''; while (i < lines.length && /^>/.test(lines[i])) { t += ' ' + lines[i].replace(/^>\s?/, ''); i++; } out.push(`<div class="callout">${mdInline(t.trim())}</div>`); continue; }
    let t = l.trim(); i++; while (i < lines.length && lines[i].trim() && !/^(#|\||>|\s*(\d+\.|[-*])\s)/.test(lines[i])) { t += ' ' + lines[i].trim(); i++; }
    out.push(`<p>${mdInline(t)}</p>`);
  }
  return out.join('\n');
}
const READ_MD = mdSection(REPORT_MD, /^the read/i);
const HANDOFF_MD = mdSection(REPORT_MD, /^handoff/i);
const readItems = (() => {                    // [{title, body}] from the numbered list under "## The read"
  const items = []; let cur = null;
  for (const l of READ_MD.split('\n')) {
    const m = l.match(/^\d+\.\s+(.*)$/);
    if (m) { cur = { raw: m[1] }; items.push(cur); } else if (cur && l.trim()) cur.raw += ' ' + l.trim(); else if (!l.trim()) cur = null;
  }
  return items.map(it => { const m = it.raw.match(/^\*\*(.+?)\*\*\s*(.*)$/); return m ? { title: m[1], body: m[2] } : { title: it.raw, body: '' }; });
})();

/* ---------- data-driven notes (replace per-run hardcoded callouts) ---------- */
const rootOf = h => { const p = String(h || '').replace(/^www\./, '').split('.'); return p.slice(-2).join('.'); };
const tracedRows = Object.values(LP).filter(r => !r.native);
const sharedFunnels = (() => {                // one landing domain carrying several different pages = an agency / network funnel
  const m = new Map();
  for (const r of tracedRows) { const d = rootOf(r.bounced ? (r.facebook.hops[0] || {}).host : r.facebook.final_host); if (!d || /google|facebook/.test(d)) continue;
    (m.get(d) || m.set(d, new Set()).get(d)).add(r.page); }
  return [...m.entries()].filter(([, s]) => s.size >= 2).map(([d, s]) => ({ domain: d, pages: [...s] })).sort((a, b) => b.pages.length - a.pages.length);
})();
const freshFlags = fresh20.map(x => ({ x, r: LP[x.id] })).filter(({ r }) => r && (r.cloaked || r.offer_mismatch));
const leastDevice = Object.entries(devTally).sort((a, b) => a[1] - b[1])[0];
const topTrig = b => ((G.triggers[b] || [])[0] || {}).name || '—';
const affPages = A.pages.filter(p => p.bucket === 'affiliate').sort((a, b) => b.total_active - a.total_active).slice(0, 5);
const durable = (G.angles.affiliate || []).filter(a => a.ads >= 10).sort((a, b) => b.median_life - a.median_life)[0];
const peakBucket = aff ? aff.table.reduce((a, b) => (b.strength > a.strength ? b : a)) : null;
const TRAFFIC = (() => { try { return JSON.parse(fs.readFileSync(path.join(RUN, 'traffic.json'), 'utf8')); } catch { return null; } })();
const SHEETSYNC = (() => { try { return JSON.parse(fs.readFileSync(path.join(RUN, 'sheet-sync.json'), 'utf8')); } catch { return null; } })();
const transcriptCount = Object.values(K).filter(k => k.voice).length;
const fmtN = n => n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n));
const pctF = f => f == null ? '—' : `${Math.round(f * 100)}%`;

function pagesToAddHtml() {
  const st = SHEETSYNC; if (!st || !st.candidates) return '<p class="muted">Sheet check not run this time.</p>';
  const url = st.sheet || '';
  const byName = Object.fromEntries(st.candidates.map(c => [c.name, c]));
  const checked = ['ready_to_type', 'nothing_new', 'verified', 'verify_failed'].includes(st.status);
  const rows = list => `<table><thead><tr><th>Page</th><th>Links</th><th class="r">On-niche ads</th><th>Bracket</th></tr></thead><tbody>${list.map(c => `<tr><td>${esc(c.name)}</td><td><a href="${esc(c.ad_library || '')}">Ad Library ↗</a> · <a href="${esc(c.facebook_page || '')}">Facebook page ↗</a></td><td class="r">${c.niche_ads ?? ''}</td><td>${esc(c.bucket || '')}${c.aggressive ? ' · aggressive' : ''}</td></tr>`).join('')}</tbody></table>`;
  const head = `<div class="callout"><b>Sheet</b><a href="${esc(url)}">${esc(url)}</a><br>Tab <b>${esc(st.tab || 'FB pages')}</b> · column <b>${esc(st.column || '—')}</b></div>`;
  if (!checked) return head + `<div class="callout warn"><b>The sheet was not checked this run.</b>These are all qualifying pages — add only the ones not already there.</div>` + rows(st.candidates);
  const toAdd = (st.status === 'verified' || st.status === 'verify_failed') ? (st.verify?.missing || []).map(n => byName[n] || { name: n })
    : (st.to_type || []).map(t => ({ ...(byName[t.name] || {}), name: t.name }));
  const added = [...new Set((st.history || []).filter(h => h.date === st.date).flatMap(h => h.added || []))];
  let html = head;
  html += toAdd.length ? `<h3>Add these (${toAdd.length})${st.to_type?.[0] && st.status === 'ready_to_type' ? ` — starting at ${esc(st.to_type[0].cell)}` : ''}</h3>` + rows(toAdd)
    : `<p><b>Nothing to add</b> — every qualifying page is already in the sheet.</p>`;
  if (added.length) html += `<h3>Added to the sheet automatically this run (${added.length})</h3>` + rows(added.map(n => byName[n] || { name: n }));
  if (st.excluded_off_vertical?.length) html += `<p class="muted">Left out as off-vertical: ${esc(st.excluded_off_vertical.join(' · '))}</p>`;
  return html;
}
function trafficHtml() {
  if (!TRAFFIC) return '<p class="muted">Domain traffic: Similarweb not connected — no traffic data this run.</p>';
  const rows = TRAFFIC.rows || [];
  return `<h3>Domain traffic — Similarweb, ${esc(TRAFFIC.month)}</h3>
  <table><thead><tr><th>Domain</th><th class="r">Top ads</th><th class="r">Monthly visits</th><th class="r">Paid social</th><th>Top country</th><th>Flags</th></tr></thead><tbody>
  ${rows.map(r => { const t = r.t || {}; const v = !r.t ? 'not fetched' : t.no_data ? 'no data' : fmtN(t.monthly_visits);
    const flags = [r.cloaked && 'cloaked', r.offer_mismatch && `→ ${r.offer_mismatch} offer`].filter(Boolean).join(' · ');
    return `<tr${flags ? ' class="hi"' : ''}><td>${esc(r.domain)}</td><td class="r">${r.ads}</td><td class="r">${esc(v)}</td><td class="r">${pctF(t.paid_social_share)}</td><td>${t.top_country ? esc(`${t.top_country} ${pctF(t.top_country_share)}`) : '—'}</td><td>${esc(flags)}</td></tr>`; }).join('')}
  </tbody></table>
  <p class="muted">Similarweb is panel data: Facebook in-app clicks are under-counted and small funnel sites often have no data. Read it as direction.</p>`;
}


const css = `
@page { size: Letter; margin: 0.5in 0.55in 0.62in; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 9.6pt/1.45 -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1b1d22; }
h1, h2, h3 { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; letter-spacing: -0.01em; margin: 0; }
h2 { font-size: 17pt; font-weight: 700; margin: 0 0 4pt; }
h2 + .sub { color: #5d6270; margin: 0 0 12pt; font-size: 9.4pt; }
h3 { font-size: 11pt; font-weight: 650; margin: 14pt 0 6pt; }
p { margin: 0 0 7pt; }
a { color: #1f5fd6; text-decoration: none; }
.muted { color: #8a8f9c; }
.section { break-before: page; }
.eyebrow { font-size: 7.6pt; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #c2410c; margin-bottom: 5pt; }

/* cover */
.cover { height: 9.7in; display: flex; flex-direction: column; }
.cover .brand { font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; color: #6b7080; font-weight: 700; }
.cover h1 { font-size: 33pt; line-height: 1.05; font-weight: 750; margin: 1.25in 0 8pt; }
.cover .date { font-size: 12pt; color: #4b5060; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; margin: 30pt 0 26pt; }
.stat { border-top: 2.5px solid #1b1d22; padding-top: 7pt; }
.stat .n { font-size: 21pt; font-weight: 700; letter-spacing: -0.02em; }
.stat .l { font-size: 8pt; color: #5d6270; margin-top: 1pt; }
.stat.hot { border-color: #c2410c; } .stat.hot .n { color: #c2410c; }
.headline { background: #fff4ec; border-left: 3.5px solid #c2410c; padding: 12pt 14pt; font-size: 11pt; line-height: 1.5; }
.note { margin-top: auto; font-size: 8.2pt; color: #6b7080; border-top: 1px solid #e3e5ea; padding-top: 8pt; }

/* the read */
ol.read { padding-left: 0; list-style: none; counter-reset: r; margin: 0; }
ol.read li { counter-increment: r; position: relative; padding: 0 0 11pt 28pt; break-inside: avoid; }
ol.read li::before { content: counter(r); position: absolute; left: 0; top: 0; width: 19pt; height: 19pt; border-radius: 50%;
  background: #1b1d22; color: #fff; font-weight: 700; font-size: 9pt; display: grid; place-items: center; }
ol.read b.t { display: block; font-size: 10.4pt; margin-bottom: 2pt; }

/* cards */
.cards { display: flex; flex-direction: column; gap: 9pt; }
.card { display: grid; grid-template-columns: 1.3in 1fr; gap: 12pt; border: 1px solid #e3e5ea; border-radius: 7pt; padding: 9pt; break-inside: avoid; }
.thumb { position: relative; background: #111318; border-radius: 4pt; height: 2.08in; overflow: hidden; display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.thumb .kind { position: absolute; left: 5pt; bottom: 5pt; background: rgba(0,0,0,.66); color: #fff; font-size: 6.6pt; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; padding: 1.5pt 4pt; border-radius: 3pt; }
.noimg { color: #777; font-size: 8pt; }
.body { display: flex; flex-direction: column; min-width: 0; }
.top { display: grid; grid-template-columns: auto 1fr auto; gap: 8pt; align-items: start; }
.rank { font-size: 15pt; font-weight: 750; color: #c9ccd4; line-height: 1; padding-top: 1pt; }
.page { font-size: 10.6pt; font-weight: 650; line-height: 1.2; }
.meta { font-size: 8.2pt; color: #4b5060; margin-top: 2pt; }
.score { text-align: right; }
.score .n { font-size: 15pt; font-weight: 750; line-height: 1; letter-spacing: -0.02em; }
.score .l { font-size: 6.6pt; letter-spacing: .08em; color: #8a8f9c; font-weight: 700; }
.hook { margin-top: 6pt; font-size: 9.1pt; line-height: 1.38; }
.hook .lbl { display: inline-block; width: 34pt; font-size: 6.8pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #8a8f9c; }
.hook.heard { color: #33384a; }
.hook.path { font-size: 8.2pt; color: #33384a; }
.flag { display: inline-block; margin-top: 2pt; font-size: 7.2pt; font-weight: 700; color: #b42318; background: #fdecea; padding: 1pt 5pt; border-radius: 3pt; }
.foot { margin-top: auto; padding-top: 7pt; display: grid; grid-template-columns: 1fr auto; row-gap: 4pt; align-items: end; }
.devs { grid-column: 1 / -1; }
.rv { font-size: 7.6pt; color: #6b7080; font-variant-numeric: tabular-nums; }
.foot a { font-size: 8.2pt; font-weight: 600; }
.pill { display: inline-block; font-size: 7pt; font-weight: 650; padding: 1.2pt 5pt; border-radius: 99pt; background: #eef0f4; color: #3f4453; margin: 0 2pt 2pt 0; white-space: nowrap; }
.pill.dev { background: #fff0e6; color: #9a3412; }
.pill.affiliate { background: #fdf3d8; color: #8a5a00; }
.pill.branded { background: #e6eefc; color: #1e4fae; }
.pill.unclassified { background: #eef0f4; color: #555a68; }

/* tables */
table { width: 100%; border-collapse: collapse; font-size: 8.6pt; margin: 4pt 0 6pt; font-variant-numeric: tabular-nums; }
th { text-align: left; font-size: 7.2pt; letter-spacing: .06em; text-transform: uppercase; color: #6b7080; font-weight: 700;
  border-bottom: 1.5px solid #1b1d22; padding: 4pt 6pt; }
td { border-bottom: 1px solid #eceef2; padding: 4.2pt 6pt; vertical-align: top; }
td.r, th.r { text-align: right; }
tr { break-inside: avoid; }
.hi td { background: #fff7f1; }
.twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
.callout { background: #f5f6f9; border-radius: 6pt; padding: 10pt 12pt; margin: 8pt 0; break-inside: avoid; }
.callout.warn { background: #fff7f1; }
.callout > b:first-child { display: block; margin-bottom: 2pt; }
ul.tight { margin: 4pt 0 8pt; padding-left: 14pt; } ul.tight li { margin-bottom: 3pt; }
.q { font-size: 9.4pt; }
.script { break-inside: avoid; border-top: 1px solid #e3e5ea; padding: 8pt 0; }
.script h4 { margin: 0 0 3pt; font-size: 9.6pt; }
.script p { font-size: 8.6pt; color: #33384a; line-height: 1.5; }
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(LABEL)} Ad Library Report ${DATE}</title><style>${css}</style></head><body>

<section class="cover">
  <div class="brand">Meta Ad Library Research</div>
  <h1>${esc(LABEL)}</h1>
  <div class="date">Competitor scan · run ${DATE} · aggressive cut first</div>
  <div class="stats">
    <div class="stat"><div class="n">${n0(A.totals.ads)}</div><div class="l">ads harvested</div></div>
    <div class="stat"><div class="n">${n0(S.length)}</div><div class="l">distinct creatives</div></div>
    <div class="stat hot"><div class="n">${aggressive.length}</div><div class="l">aggressive (${(aggressive.length / Math.max(S.length, 1) * 100).toFixed(1)}%)</div></div>
    <div class="stat hot"><div class="n">${fresh.length}</div><div class="l">new &amp; already scaling</div></div>
  </div>
  ${readItems[0] ? `<div class="headline"><b>${mdInline(readItems[0].title)}</b> ${mdInline(clip(readItems[0].body, 330))}</div>` : ''}
  <div style="margin-top:18pt" class="twocol">
    <div><h3 style="margin-top:0">In this report</h3>
      <ul class="tight"><li>The read${readItems.length ? ` — ${readItems.length} findings` : ''}</li><li>Top ${topAgg.length} most aggressive ads, with thumbnails</li><li>Top ${topRvert.length} by RVERT alone</li><li>Launched &lt;14 days &amp; already scaling</li><li>Where the clicks go — redirects, cloaking, traffic</li><li>Aggression devices</li><li>Background: triggers, angles, lifespan, operators</li><li>Handoff · appendix of spoken scripts</li></ul></div>
    <div><h3 style="margin-top:0">Why the aggressive cut leads</h3>
      <p>Only ${aggressive.length} of ${S.length} creatives carry any aggression device. Device-carrying creatives are duplicated <b>x${dupWith}</b> on average vs <b>x${dupWithout}</b> — advertisers scale what pays.</p></div>
  </div>
  <div class="note">${A.baseline ? 'Baseline run — no prior week, so no week-over-week deltas yet.' : `Compared with the run of ${esc(A.prev_date || '—')}${A.gap_days ? ` (${A.gap_days} days earlier)` : ''}.`} Harvested logged-out. RVERT is a structural read of each offer, not measured performance — read it next to lifespan and duplication, which are the advertiser’s own money talking.</div>
</section>

<section class="section">
  <div class="eyebrow">Summary</div><h2>The read</h2><div class="sub">What changed, and what to do about it.</div>
  ${READ_MD ? mdBlocks(READ_MD) : '<div class="callout warn"><b>No written findings yet.</b>Write REPORT.md (with a “## The read” section) before rendering the PDF.</div>'}
  <div class="callout"><b>How to read the scores</b>RVERT = <b>((R × V) − (E + Rk)) ÷ √T × U</b> — Real (believability), Value (payoff vs the anchor), Energy and Risk (friction), Time to the promised payoff, and Urgency (“why now”). It scores the structure of the offer. <b>Lifespan and duplication are the real verdict</b>: a high score at 3 days is a hypothesis; the same score at 60 days and x50 is a conclusion.</div>
</section>

<section class="section">
  <div class="eyebrow">Section 1</div><h2>Top ${topAgg.length} — the most aggressive ads</h2>
  <div class="sub">Ranked by <b>aggressiveness</b> — the weighted devices each ad uses: ${activeDeviceWeights(S, NICHE_CFG.analysis?.aggression_weights || {}).map(([d, w]) => `${esc(d)} ${w}`).join(' · ')}. Ties break by urgency, then RVERT, then duplication. Copies of one ad swapped across counties or states count once. <b>Copy</b> is the first line of body text; <b>Heard</b> is the voiceover’s opening line.${topAgg.length < AGGRESSIVE_TOP_N ? ` Only ${topAgg.length} ads in this niche use any qualifying device.` : ''}</div>
  <div class="cards">${topAgg.map((x, i) => card(x, i, 'agg')).join('')}</div>
</section>

<section class="section">
  <div class="eyebrow">Section 1b</div><h2>Top ${topRvert.length} — ranked by RVERT alone</h2>
  <div class="sub">A companion cut, not a duplicate: this ranks purely by <b>RVERT</b> — believability × payoff vs. friction and time — with <b>no</b> aggressiveness or evidence filter. A high-RVERT ad can use zero pressure tactics, and a top-aggressiveness ad can score low on RVERT; the two lists are expected to disagree, and mostly do. Same geo-dedup as Section 1.</div>
  <div class="cards">${topRvert.map((x, i) => card(x, i, 'rvert')).join('')}</div>
</section>

<section class="section">
  <div class="eyebrow">Section 2</div><h2>Launched in the last 14 days, already scaling</h2>
  <div class="sub">${fresh.length} creatives under two weeks old already duplicated x3+. An advertiser cloning a two-week-old creative has decided fast that it works — the earliest read on a new winner. Top 20 by duplication.</div>
  ${freshFlags.length ? `<div class="callout warn"><b>Check the landing path before trusting a low score.</b>${freshFlags.map(({ x, r }) => `<b style="display:inline">${esc(x.page)}</b> (x${x.family_coll} in ${lifeOf(x)}d) ${r.bounced ? 'is cloaked — non-Facebook visitors are bounced to google.com, so the offer behind the filter is invisible to copy scoring' : r.cloaked ? 'is cloaked — different visitors land on different sites' : `routes to a ${esc(r.offer_mismatch)} offer`}`).join('; ')}.</div>` : ''}
  <div class="cards">${fresh20.map((x, i) => card(x, i, 'fresh')).join('')}</div>
</section>

<section class="section">
  <div class="eyebrow">Section 2b</div><h2>Where the clicks actually go</h2>
  <div class="sub">Every top ad’s link followed hop by hop, as a Facebook in-app click and again as mobile Safari. Page requests only — no forms submitted.</div>
  ${tracedRows.length ? (() => { const uniq = new Map(); for (const r of tracedRows) if (!uniq.has(r.landing_url)) uniq.set(r.landing_url, r);
    const u = [...uniq.values()];
    return `<div class="stats" style="margin:4pt 0 14pt"><div class="stat"><div class="n">${u.length}</div><div class="l">unique ad links traced</div></div>
      <div class="stat"><div class="n">${u.filter(r => r.redirect_count > 0).length}</div><div class="l">redirect before landing</div></div>
      <div class="stat hot"><div class="n">${u.filter(r => r.cloaked).length}</div><div class="l">cloaked funnels</div></div>
      <div class="stat hot"><div class="n">${u.filter(r => r.offer_mismatch).length}</div><div class="l">ad → different offer</div></div></div>
    <table><thead><tr><th>Page</th><th>Pathway</th><th>Tracker</th><th>Lands on</th><th>Flag</th></tr></thead><tbody>
    ${u.sort((a, b) => (b.cloaked - a.cloaked) || (!!b.offer_mismatch - !!a.offer_mismatch) || (b.redirect_count - a.redirect_count)).map(r => {
      const fin = (r.facebook.hops.find(h => h.final) || {});
      const flag = r.bounced ? 'cloaked → google.com' : r.cloaked ? 'cloaked' : r.offer_mismatch ? `→ ${r.offer_mismatch} offer` : '';
      return `<tr${flag ? ' class="hi"' : ''}><td>${esc(r.page)}</td><td>${esc(r.pathway)}</td><td>${esc(r.tracker || '—')}</td><td>${r.bounced ? '—' : esc(clip(fin.title || r.facebook.final_host, 48))}</td><td>${esc(flag)}</td></tr>`; }).join('')}
    </tbody></table>`; })() : '<p class="muted">Landing paths were not traced this run.</p>'}
  ${sharedFunnels.length ? `<div class="callout"><b>Shared funnels — one domain carrying several pages.</b>${sharedFunnels.slice(0, 4).map(f => `<code>${esc(f.domain)}</code>: ${esc(f.pages.join(', '))}`).join('<br>')}<br>Several pages landing on one domain usually means an agency or network funnel buying for multiple advertisers.</div>` : ''}
  ${trafficHtml()}
</section>

<section class="section">
  <div class="eyebrow">Section 3</div><h2>Aggression devices</h2>
  <div class="sub">A device is a specific, detectable move that pushes a decision rather than describing an offer. The five RVERT variables score how good the deal is; devices score how hard the ad pushes.</div>
  <div class="twocol">
    <div><table><thead><tr><th>Device</th><th class="r">Ads</th></tr></thead><tbody>
      ${Object.entries(devTally).sort((a, b) => b[1] - a[1]).map(([d, n]) => `<tr><td>${esc(d)}</td><td class="r">${n}</td></tr>`).join('')}
    </tbody></table></div>
    <div>
      <table><thead><tr><th></th><th class="r">With device</th><th class="r">Without</th></tr></thead><tbody>
        <tr class="hi"><td><b>Avg. duplication</b></td><td class="r"><b>x${dupWith}</b></td><td class="r">x${dupWithout}</td></tr>
        <tr><td>Avg. RVERT</td><td class="r">${mean(withDev.map(x => x.score)).toFixed(2)}</td><td class="r">${mean(noDev.map(x => x.score)).toFixed(2)}</td></tr>
        <tr><td>Creatives</td><td class="r">${withDev.length}</td><td class="r">${noDev.length}</td></tr>
      </tbody></table>
      ${leastDevice ? `<div class="callout"><b>Least-used device: ${esc(leastDevice[0])}.</b>Only ${leastDevice[1]} creative${leastDevice[1] === 1 ? '' : 's'} in the niche use it — an open lane if it fits your offer.</div>` : ''}
    </div>
  </div>
  ${trialRows.length ? `<h3>The trial / beta ask — who’s running it</h3>
  <table><thead><tr><th>Page</th><th class="r">Creatives</th><th class="r">Total dup</th><th class="r">Newest</th></tr></thead><tbody>
    ${trialRows.map(([p, v]) => `<tr${v.newest <= 10 ? ' class="hi"' : ''}><td>${esc(p)}</td><td class="r">${v.n}</td><td class="r">${n0(v.dup)}</td><td class="r">${v.newest}d${v.newest <= 10 ? ' · new' : ''}</td></tr>`).join('')}
  </tbody></table>
  <p class="muted">Highlighted rows adopted it within the last 10 days.</p>` : ''}
</section>

<section class="section">
  <div class="eyebrow">Section 4</div><h2>Background — the full corpus</h2>
  <div class="sub">All ${n0(A.totals.niche_ads)} on-niche ads, aggressive or not. Top trigger — affiliate: <b>${esc(topTrig('affiliate'))}</b>; branded: <b>${esc(topTrig('branded'))}</b>.</div>
  <div class="twocol">
    <div><h3 style="margin-top:0">Emotional triggers</h3>
      <table><thead><tr><th>Trigger</th><th class="r">Affiliate</th><th class="r">Branded</th></tr></thead><tbody>
      ${(G.triggers.affiliate || []).slice(0, 8).map(t => `<tr><td>${esc(t.name)}</td><td class="r">${t.share}%</td><td class="r">${trig('branded', t.name).share ?? '—'}%</td></tr>`).join('')}
      </tbody></table></div>
    <div><h3 style="margin-top:0">Affiliate angles</h3>
      <table><thead><tr><th>Angle</th><th class="r">Share</th><th class="r">Median life</th></tr></thead><tbody>
      ${(G.angles.affiliate || []).slice(0, 8).map(a => `<tr${durable && a.name === durable.name ? ' class="hi"' : ''}><td>${esc(a.name)}</td><td class="r">${a.share}%</td><td class="r">${a.median_life}d</td></tr>`).join('')}
      </tbody></table>
      ${durable ? `<p class="muted">Most durable: ${esc(durable.name)} at a ${durable.median_life}-day median life on ${durable.share}% share.</p>` : ''}</div>
  </div>
  <div class="twocol">
    ${aff ? `<div><h3>Creative life span — affiliate</h3>
      <table><thead><tr><th>Period</th><th class="r"># Ads</th><th class="r">Strength</th></tr></thead><tbody>
      ${aff.table.map(r => `<tr${peakBucket && r.period === peakBucket.period ? ' class="hi"' : ''}><td>${r.period}</td><td class="r">${r.ads}</td><td class="r">${r.strength}</td></tr>`).join('')}
      </tbody></table>
      ${peakBucket ? `<p class="muted">Duplication peaks in the ${peakBucket.period} bucket — where winners get cloned.</p>` : ''}</div>` : '<div></div>'}
    <div><h3>Largest affiliate operators</h3>
      <table><thead><tr><th>Page</th><th class="r">Library</th><th class="r">Creatives</th><th class="r">Median life</th></tr></thead><tbody>
      ${affPages.map(p => `<tr><td>${esc(p.page)}</td><td class="r">${p.total_active}</td><td class="r">${p.creatives_distinct}</td><td class="r">${p.median_life}d</td></tr>`).join('')}
      </tbody></table>
      ${affPages[0] ? `<p class="muted">${esc(affPages[0].page)} runs ${affPages[0].total_active} active ads off ${affPages[0].creatives_distinct} creatives.</p>` : ''}</div>
  </div>
</section>

<section class="section">
  <div class="eyebrow">Section 5</div><h2>Handoff</h2><div class="sub">What to build, what to test, what to re-check next run.</div>
  ${HANDOFF_MD ? mdBlocks(HANDOFF_MD) : '<div class="callout warn"><b>No handoff written yet.</b>Add a “## Handoff” section to REPORT.md before rendering the PDF.</div>'}
  <div class="callout"><b>Files on disk</b>${S.length} distinct creatives (${aggressive.length} aggressive) and ${transcriptCount} voiceover transcripts are saved under <code>~/Documents/AdLibraryResearch/fb-ad-library/${esc(NICHE)}/</code> — <code>_top/${DATE}-aggressive-top${AGGRESSIVE_TOP_N}/</code> and <code>_top/${DATE}-new-launches/</code> hold the ads in this report.</div>
</section>

<section class="section">
  <div class="eyebrow">Appendix</div><h2>Spoken scripts — top ${topAgg.length} most aggressive</h2>
  <div class="sub">Full voiceover transcripts for the voiced ads in Section 1. Copy the structure, not the words.</div>
  ${topAgg.filter(x => (K[x.hash] || {}).voice && K[x.hash].text).map((x, i) => `<div class="script"><h4>${esc(x.page)} <span class="muted">· ${lifeOf(x)}d · x${x.family_coll} · RVERT ${x.score} · <a href="${esc(x.link)}">ad ↗</a></span></h4><p>${esc(clip(K[x.hash].text, 1500))}</p></div>`).join('')}
</section>
</body></html>`;

const htmlPath = path.join(RUN, `report-${DATE}.html`);
fs.writeFileSync(htmlPath, html);

/* ---------- print with an isolated headless Chrome ---------- */
// Headless Chrome on macOS writes the PDF and then does NOT exit, so waiting on
// the process hangs forever. Spawn it, wait for the file to stop growing, kill.
// --use-mock-keychain + --password-store=basic stop a fresh profile from
// triggering an invisible Keychain prompt. The throwaway --user-data-dir keeps
// this fully separate from the user's own Chrome and its logged-in sessions.
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const raw = path.join(TMP, 'raw.pdf');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-print-profile-'));
const { spawn } = await import('node:child_process');
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--use-mock-keychain',
  '--password-store=basic', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  '--no-pdf-header-footer', `--print-to-pdf=${raw}`, 'file://' + htmlPath], { stdio: 'ignore', detached: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = -1, stable = 0; const deadline = Date.now() + 120000;
while (Date.now() < deadline) {
  await sleep(1000);
  const size = fs.existsSync(raw) ? fs.statSync(raw).size : 0;
  if (size > 0 && size === last) { if (++stable >= 2) break; } else stable = 0;
  last = size;
}
try { process.kill(-chrome.pid, 'SIGTERM'); } catch { try { chrome.kill('SIGTERM'); } catch {} }
await sleep(500);
fs.rmSync(profile, { recursive: true, force: true });
if (!fs.existsSync(raw) || fs.statSync(raw).size === 0) { console.error('Chrome produced no PDF within 120s'); process.exit(1); }

/* ---------- stamp page numbers + metadata ---------- */
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
w.add_metadata({"/Title": sys.argv[3], "/Author": "AdLibraryResearch research", "/Subject": "Meta Ad Library competitor scan"})
with open(sys.argv[2], "wb") as f: w.write(f)
print(n)
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const pages = execFileSync('python3', ['-c', py, raw, OUT, `${LABEL} · Meta Ad Library · ${DATE}`]).toString().trim();
fs.rmSync(TMP, { recursive: true, force: true });
fs.copyFileSync(OUT, path.join(RUN, `report-${DATE}.pdf`));
console.log(JSON.stringify({ ok: true, out: OUT, pages: +pages, bytes: fs.statSync(OUT).size, archived: path.join(RUN, `report-${DATE}.pdf`), html: htmlPath }, null, 2));
