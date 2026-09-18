#!/usr/bin/env node
/* Pay-per-call PDF — the designed report for call niches (ACA first).
 *
 * The standard pdf.mjs leads with the home-services aggressive cut. A
 * pay-per-call run is about who asks for the phone call, who refuses it, and
 * the pages behind them, so this renders the WHOLE REPORT.md (every "## "
 * section, in order) in the same design — the CSS is read from pdf.mjs at
 * runtime so the two stay visually in sync — and adds thumbnail cards where
 * they carry the finding:
 *   call-driven creatives (inside the call-cut section) · anti-call creatives ·
 *   Spanish / Vietnamese creatives · most aggressive offers · an advertiser page
 *   table with Facebook-page and Ad Library links · spoken-script appendix.
 * Off-niche leaks are dropped from every card list and the page table through
 * the niche config's `report.exclude_page_regex` / `exclude_copy` / `exclude_hook`.
 *
 *   node pdf-calls.mjs --niche aca --date 2026-09-12 [--out ~/Downloads/x.pdf] [--dry]
 * --dry prints what each card list will contain (and what the filters dropped)
 * without rendering. Saves to ~/Downloads and archives report-<date>.pdf in the
 * run folder. Needs REPORT.md, scored.json, scripts.json, calls.json, pages.json.
 * Owned by the ACA session; not part of run.sh — run it last, after REPORT.md.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rankByAggressiveness, aggressivenessScore, byAggressiveness, lifeOf, normHook } from './rank.mjs';

const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); args[k] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; } }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const NICHE = args.niche || 'aca';
const DATE = args.date || new Date().toISOString().slice(0, 10);
const ROOT = args.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE), RUN = path.join(BASE, '_reports', DATE);
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'config', 'niches', `${NICHE}.json`), 'utf8'));
const RC = CFG.report || {};
const LABEL = RC.title || CFG.label || NICHE.toUpperCase();
const OUT = String(args.out || path.join(os.homedir(), 'Downloads', `${RC.file_slug || NICHE.toUpperCase()}-Ad-Library-Report-${DATE}.pdf`)).replace(/^~/, os.homedir());

const J = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(RUN, f), 'utf8')); } catch { if (d !== undefined) return d; console.error(`missing ${f} in ${RUN} — run the pipeline first`); process.exit(1); } };
const S = J('scored.json'), K = J('scripts.json', {}), C = J('calls.json', null), P = J('pages.json', []), A = J('analysis.json');
/* call-offers mode (config report.call_offers_only): every card, table and count comes from offers.json —
   ACA-explicit ads whose conversion is an inbound phone call. Lead gen is only counted. */
const CALL_MODE = !!RC.call_offers_only;
const OFF = CALL_MODE ? J('offers.json') : null;
let REPORT = ''; try { REPORT = fs.readFileSync(path.join(RUN, 'REPORT.md'), 'utf8'); } catch { console.error('write REPORT.md before rendering the PDF'); process.exit(1); }
REPORT = REPORT.replace(/\[([^\]]+)\]\((?!https?:)[^)\s]+\)/g, '`$1`');   // local file links become code spans

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const n0 = v => Number(v || 0).toLocaleString('en-US');
const pill = (t, cls = '') => `<span class="pill ${cls}">${esc(t)}</span>`;
const bucketPill = b => pill(b || 'unclassified', b || 'unclassified');
const fmtPhone = d => /^\d{10}$/.test(String(d)) ? `(${String(d).slice(0, 3)}) ${String(d).slice(3, 6)}-${String(d).slice(6)}` : String(d || '');
const hostPath = u => { try { const x = new URL(u); return clip(x.hostname.replace(/^www\./, '') + (x.pathname !== '/' ? x.pathname : ''), 60); } catch { return ''; } };
const trimName = s => String(s || '').trim();
const ev = x => (x.family_coll || 1) * Math.min(lifeOf(x), 120);
const byEv = (a, b) => ev(b) - ev(a) || (b.score || 0) - (a.score || 0);
const libLink = pid => `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&view_all_page_id=${pid}&search_type=page&media_type=all`;

function mdInline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(“"])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')   // italics first: bold lines often contain *quoted* hooks
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(“"])_([^_\s][^_]*)_(?=[\s.,;:!?)”"]|$)/g, '$1<i>$2</i>');
}
function mdBlocks(md) {                        // paragraphs, ### headings, lists, tables, callout quotes (same grammar as pdf.mjs)
  const out = []; const lines = String(md || '').split('\n'); let i = 0;
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
      out.push(`<${ordered ? 'ol' : 'ul'} class="${ordered ? 'read' : 'tight'}">${items.map(t => `<li>${ordered ? mdInline(t).replace(/^<b>((?:(?!<\/b>).)+)<\/b>\s*/, '<b class="t">$1</b>') : mdInline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`); continue; }
    if (/^>/.test(l)) { let t = ''; while (i < lines.length && /^>/.test(lines[i])) { t += ' ' + lines[i].replace(/^>\s?/, ''); i++; } out.push(`<div class="callout">${mdInline(t.trim())}</div>`); continue; }
    let t = l.trim(); i++; while (i < lines.length && lines[i].trim() && !/^(#|\||>|\s*(\d+\.|[-*])\s)/.test(lines[i])) { t += ' ' + lines[i].trim(); i++; }
    out.push(`<p>${mdInline(t)}</p>`);
  }
  return out.join('\n');
}
function sections(md) {
  const out = []; let cur = { title: '', lines: [] };
  for (const l of md.split('\n')) { if (/^##\s/.test(l)) { out.push(cur); cur = { title: l.replace(/^##\s+/, '').trim(), lines: [] }; } else cur.lines.push(l); }
  out.push(cur);
  return out.map(s => ({ title: s.title, num: (s.title.match(/^(\d+[a-z]?)\s*·/) || [])[1] || null, short: s.title.replace(/^\d+[a-z]?\s*·\s*/i, ''), body: s.lines.join('\n').trim() }));
}
function splitSub(md, re) {                   // -> { before, body, after } around one ### subsection
  const lines = md.split('\n'); const i = lines.findIndex(l => /^###\s/.test(l) && re.test(l.replace(/^###\s+/, '')));
  if (i < 0) return null; const j = lines.findIndex((l, k) => k > i && /^###\s/.test(l));
  return { before: lines.slice(0, i).join('\n'), body: lines.slice(i + 1, j < 0 ? undefined : j).join('\n'), after: j < 0 ? '' : lines.slice(j).join('\n') };
}

/* ---------- which ads go on cards ---------- */
const exPageRe = RC.exclude_page_regex ? new RegExp(RC.exclude_page_regex, 'i') : null;
const exNames = new Set((RC.exclude_pages || []).map(trimName));
const exCopyRe = RC.exclude_copy ? new RegExp(RC.exclude_copy, 'i') : null;
const exHookRe = RC.exclude_hook ? new RegExp(RC.exclude_hook, 'i') : null;
const pageOk = name => !exNames.has(trimName(name)) && !(exPageRe && exPageRe.test(trimName(name)));
const dropReason = x => !pageOk(x.page) ? 'page' : (exCopyRe && exCopyRe.test(`${x.body || ''} ${x.title || ''}`)) ? `copy "${(`${x.body || ''} ${x.title || ''}`.match(exCopyRe) || [])[0]}"` : (exHookRe && exHookRe.test(trimName(x.copy_hook))) ? 'hook' : '';
const onNiche = x => !dropReason(x);
const antiRe = CFG.call_signals?.anti_regex ? new RegExp(CFG.call_signals.anti_regex, 'i') : null;
const isAnti = x => !!(antiRe && antiRe.test(`${x.body || ''} ${x.title || ''}`));
const VI = /[ăđơư]|[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const ES_WORDS = /\b(de|la|el|tu|su|para|con|que|los|las|del|por|una|seguro|salud|cobertura|planes|gratis|m[eé]dico|familia|ahora|aplicar|califica|ingresos|permiso|trabajo|cr[eé]dito)\b/gi;
const ES_STRONG = /\b(seguro|salud|cobertura|gratis|ll[aá]manos|ll[aá]ma|m[eé]dico|familia|ahora|califica|obt[eé]n|cotiza|protege)\b|[¿¡ñ]/i;
const langOf = x => { const t = `${x.body || ''} ${x.title || ''}`; if (VI.test(t)) return 'Vietnamese'; if (ES_STRONG.test(t) && (t.match(ES_WORDS) || []).length >= 5) return 'Spanish'; return null; };

function collapse(list, perPage = 99) {       // near-identical copy (geo / number swaps, cloned templates) counts once
  const kept = [], per = {};
  for (const x of list) {
    const key = normHook(x), w = new Set(key.split(' ').filter(Boolean));
    const m = kept.find(k => {
      if (w.size < 4 || k._w.size < 4) return k._key === key && trimName(k.page) === trimName(x.page);
      let i = 0; for (const t of w) if (k._w.has(t)) i++;
      return i / (w.size + k._w.size - i) >= 0.72;
    });
    if (m) { m.variants++; m.variants_dup += (x.family_coll || 1); m.variant_pages.add(trimName(x.page)); continue; }
    const pg = trimName(x.page); if ((per[pg] || 0) >= perPage) continue; per[pg] = (per[pg] || 0) + 1;
    kept.push({ ...x, _key: key, _w: w, variants: 1, variants_dup: x.family_coll || 1, variant_pages: new Set([pg]) });
  }
  return kept;
}
let callCards = collapse(S.filter(x => x.call && onNiche(x)).sort(byEv)).slice(0, RC.call_cards || 20);
let antiCards = collapse(S.filter(x => isAnti(x) && onNiche(x)).sort(byEv)).slice(0, RC.anti_cards || 12);
let langCards = collapse(S.filter(x => onNiche(x) && langOf(x)).sort(byEv), 3).slice(0, RC.lang_cards || 10);
const W = CFG.analysis?.aggression_weights || {};
let aggCards = collapse(rankByAggressiveness(S.filter(onNiche), 1000).map(x => ({ ...x, aggressiveness: aggressivenessScore(x.devices, W) })), 3).slice(0, RC.agg_cards || 20);
let scriptRows = S.filter(x => x.call && onNiche(x) && x.kind === 'video' && (K[x.hash] || {}).voice && K[x.hash].text).sort(byEv).slice(0, RC.script_rows || 15);
let offerPages = [];
if (CALL_MODE) {
  const OC = OFF.creatives.map(c => ({ ...c, call: true, call_signals: c.signals, phone: (c.phones || [])[0] || null, rvert: c.rvert || {}, score: c.score ?? '—' })).filter(onNiche);
  callCards = collapse(OC).slice(0, RC.call_cards || 30);
  langCards = collapse(OC.filter(x => x.lang && x.lang !== 'English'), 3).slice(0, RC.lang_cards || 12);
  aggCards = collapse(OC.filter(x => (x.aggression || 0) > 0).map(x => ({ ...x, aggressiveness: aggressivenessScore(x.devices, W) })).sort(byAggressiveness), 3).slice(0, RC.agg_cards || 15);
  antiCards = [];
  scriptRows = OC.filter(x => x.kind === 'video' && (K[x.hash] || {}).voice && K[x.hash].text).slice(0, RC.script_rows || 20);
  offerPages = OFF.pages.filter(p => pageOk(p.page));
}
const antiByPage = {}; for (const a of (C?.anti_call?.ads_list || [])) { const k = trimName(a.page); antiByPage[k] = antiByPage[k] || { ads: 0, coll: 0 }; antiByPage[k].ads++; antiByPage[k].coll += a.coll || 1; }
const antiOf = p => (antiByPage[trimName(p.page)] || {}).ads || 0;
const waOf = p => +((((p.ctas || []).find(c => /whatsapp/i.test(c)) || '').match(/\((\d+)\)/) || [0, 0])[1]);
const sigOf = p => (p.call_ads || 0) + antiOf(p) + waOf(p);
const pageRows = P.filter(p => pageOk(p.page) && sigOf(p)).sort((a, b) => (sigOf(b) - sigOf(a)) || (b.niche_ads - a.niche_ads)).slice(0, RC.page_rows || 40);
const quietRows = P.filter(p => pageOk(p.page) && !sigOf(p)).sort((a, b) => b.niche_ads - a.niche_ads).slice(0, RC.quiet_rows || 12);
const SECS = sections(REPORT);

if (args.dry) {
  const show = (n, l) => { console.log(`\n== ${n} (${l.length})`); l.forEach((x, i) => console.log(String(i + 1).padStart(3), String(Math.round(lifeOf(x))).padStart(4) + 'd', ('x' + (x.variants > 1 ? x.variants_dup : x.family_coll)).padEnd(5), trimName(x.page).slice(0, 30).padEnd(31), '::', clip(x.copy_hook, 60), '|', clip(x.body, 80))); };
  if (CALL_MODE) console.log('\n== CALL MODE scope', JSON.stringify(OFF.scope));
  show('call-driven cards', callCards); show('anti-call cards', antiCards); show('Spanish / Vietnamese cards', langCards); show('most aggressive cards', aggCards);
  console.log('\n== dropped by filters (call-driven + aggressive + language candidates)');
  for (const x of S.filter(x => (x.call || x.aggression > 0 || langOf(x) || isAnti(x)) && dropReason(x))) console.log('   -', trimName(x.page).slice(0, 34).padEnd(35), dropReason(x).padEnd(26), '::', clip(x.copy_hook, 70));
  if (CALL_MODE) { console.log('\n== offer pages'); offerPages.forEach((p, i) => console.log(String(i + 1).padStart(3), p.page.slice(0, 34).padEnd(35), p.bucket.padEnd(12), 'offers', p.offer_ads, 'of', p.aca_ads, 'oldest', p.oldest + 'd', p.phones.join(' '))); }
  console.log('\n== page table'); pageRows.forEach((p, i) => console.log(String(i + 1).padStart(3), trimName(p.page).slice(0, 34).padEnd(35), p.bucket.padEnd(12), 'aca', String(p.niche_ads).padEnd(4), 'call', String(p.call_ads).padEnd(3), 'anti', String(antiOf(p)).padEnd(3), 'wa', String(waOf(p)).padEnd(3), clip((p.categories || []).join('/'), 26)));
  console.log('\n== quiet pages:', quietRows.map(p => `${trimName(p.page)} (${p.niche_ads})`).join(' | '));
  console.log('\n== pages dropped from table:', P.filter(p => !pageOk(p.page)).map(p => trimName(p.page)).join(' | '));
  console.log('\n== scripts:', scriptRows.map(x => `${trimName(x.page)} (${Math.round(lifeOf(x))}d x${x.family_coll})`).join(' | '));
  console.log('\n== sections:', SECS.map(s => s.title || '(head)').join(' | '));
  console.log('\n== totals: ads', A.totals.ads, 'on-niche', A.totals.niche_ads, 'call', C?.total?.call_ads, `(${C?.total?.call_share}%)`, 'anti', C?.anti_call?.ads, 'x' + C?.anti_call?.coll);
  process.exit(0);
}

/* ---------- thumbnails: resize once, embed ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'adlib-pdfcalls-'));
function thumb(x) {
  const cands = x.kind === 'video' ? ['t1.5', 't3', 't0.5'].map(t => path.join(BASE, '_frames', `${x.hash}-${t}.jpg`)) : ['jpg', 'png'].map(e => path.join(BASE, '_creatives', `${x.hash}.${e}`));
  const use = cands.find(f => fs.existsSync(f)); if (!use) return null;
  const out = path.join(TMP, `${x.hash}.jpg`);
  if (!fs.existsSync(out)) { try { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', use, '-vf', "scale='min(420,iw)':-2", '-q:v', '5', out]); } catch { return null; } }
  return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
}
const SIG = { 'cta:CALL_NOW': 'Call Now button', 'cta:call-text': 'call CTA', 'phone-in-copy': 'number in copy', 'tel-link': 'tel: link', 'call-language': 'call ask in copy', 'lander:call': 'call lander', 'lander:call+form': 'call + form lander' };
const dupText = x => x.variants > 1 ? `x${x.variants_dup} across ${x.variants} near-identical creatives${x.variant_pages.size > 1 ? ` on ${x.variant_pages.size} pages` : ''}`
  : x.geo_variants > 1 ? `x${x.variants_dup_total} across ${x.geo_variants} variants` : `x${x.family_coll || 1}`;
function card(x, i, mode) {
  const k = K[x.hash] || {}, t = thumb(x), r = x.rvert || {}, lang = x.lang ? (x.lang === 'English' ? null : x.lang) : langOf(x);
  const heard = x.kind === 'video' ? (k.voice ? `“${esc(clip(k.spoken_hook, 170))}”` : (k.words > 1 ? '<em>only a few spoken words — no real voiceover</em>' : '<em>no voiceover — music and on-screen text</em>')) : null;
  const box = mode === 'agg' ? `<div class="score"><div class="n">${x.aggressiveness}</div><div class="l">AGGRESSIVE</div></div>` : `<div class="score"><div class="n">${x.score}</div><div class="l">RVERT</div></div>`;
  const pills = [...(x.call ? (x.call_signals || []).map(s => pill(SIG[s] || s, 'call')) : []), x.phone ? pill(fmtPhone(x.phone), 'phone') : '',
    isAnti(x) ? pill('promises no call', 'anti') : '', lang ? pill(lang, 'lang') : '', ...(x.devices || []).map(d => pill(d, 'dev'))].filter(Boolean).join(' ');
  const title = clip(x.title, 130);
  return `<article class="card">
    <div class="thumb">${t ? `<img src="${t}">` : '<div class="noimg">no preview</div>'}<span class="kind">${esc(x.kind)}</span></div>
    <div class="body">
      <div class="top"><span class="rank">${String(i + 1).padStart(2, '0')}</span>
        <div class="who"><div class="page">${esc(trimName(x.page))}</div>
          <div class="meta">${bucketPill(x.bucket)} alive <b>${Math.round(lifeOf(x))}d</b> · dup <b>${esc(dupText(x))}</b> · CTA ${esc(x.cta || '—')}</div></div>
        ${box}</div>
      <div class="hook"><span class="lbl">Copy</span>“${esc(clip(x.copy_hook, 190))}”</div>
      ${title && !clip(x.copy_hook, 400).startsWith(title.replace(/…$/, '')) ? `<div class="hook ttl"><span class="lbl">Title</span>${esc(title)}</div>` : ''}
      ${heard ? `<div class="hook heard"><span class="lbl">Heard</span>${heard}</div>` : ''}
      ${x.url && hostPath(x.url) ? `<div class="hook path"><span class="lbl">Lands</span>${esc(hostPath(x.url))}</div>` : ''}
      <div class="foot"><div class="devs">${pills || '<span class="muted">—</span>'}</div>
        <div class="rv">${mode === 'agg' ? `RVERT ${x.score} · ` : ''}R ${r.R_real ?? '—'} · V ${r.V_value ?? '—'} · E ${r.E_energy ?? '—'} · Rk ${r.R_risk ?? '—'} · T ${r.T_time ?? '—'}${x.urgency > 1 ? ` · U ×${x.urgency}` : ''}</div>
        <a href="${esc(x.link)}">View in Ad Library ↗</a></div>
    </div></article>`;
}
const cards = (list, mode) => `<div class="cards">${list.map((x, i) => card(x, i, mode)).join('')}</div>`;
function offerPageTable(rows) {
  return `<table class="pages"><thead><tr><th>#</th><th>Page</th><th>Bracket</th><th class="r">Likes</th><th class="r">Call offers</th><th class="r">Active</th><th class="r">Oldest</th><th>Numbers</th><th>How the call is asked · lander</th><th>Links</th></tr></thead><tbody>
  ${rows.map((p, i) => `<tr><td>${i + 1}</td><td><b>${esc(p.page)}</b><br><span class="muted">${esc(clip(p.category || '—', 34))}</span></td><td>${bucketPill(p.bucket)}</td><td class="r">${p.likes == null ? '—' : n0(p.likes)}</td><td class="r">${p.offer_ads}<span class="muted"> of ${p.aca_ads}</span></td><td class="r">${p.active}</td><td class="r">${p.oldest}d</td><td class="nw">${(p.phones || []).slice(0, 3).map(fmtPhone).map(esc).join('<br>') || '—'}</td><td>${esc(clip(Object.entries(p.signals || {}).map(([k, v]) => `${SIG[k] || k} ${v}`).join(' · ') || 'call + form lander', 80))}${(p.lander_hosts || []).length ? `<br><span class="muted">${esc(clip(p.lander_hosts.join(', '), 50))}</span>` : ''}</td><td class="nw"><a href="${esc(p.profile)}">Page&nbsp;↗</a><br><a href="${esc(p.library)}">Ads&nbsp;↗</a></td></tr>`).join('')}
  </tbody></table>`;
}
function pageTable(rows) {
  return `<table class="pages"><thead><tr><th>#</th><th>Page</th><th>Bracket</th><th class="r">Likes</th><th class="r">ACA ads</th><th>Signals</th><th>Numbers in copy</th><th>Where the ads go · CTAs</th><th>Links</th></tr></thead><tbody>
  ${rows.map((p, i) => `<tr${p.call_ads ? ' class="hi"' : ''}><td>${i + 1}</td><td><b>${esc(trimName(p.page))}</b><br><span class="muted">${esc(clip((p.categories || []).join(', ') || '—', 34))}</span></td><td>${bucketPill(p.bucket)}</td><td class="r">${p.likes == null ? '—' : n0(p.likes)}</td><td class="r">${p.niche_ads}</td><td>${[p.call_ads ? `call ${p.call_ads}` : '', antiOf(p) ? `anti ${antiOf(p)}` : '', waOf(p) ? `WhatsApp ${waOf(p)}` : ''].filter(Boolean).join(' · ') || '—'}</td><td class="nw">${(p.phones || []).map(fmtPhone).map(esc).join('<br>')}</td><td>${esc(clip((p.domains || []).map(d => d.replace(/\s*\(\d+\)$/, '')).join(', ') || 'native · Messenger · WhatsApp', 58))}<br><span class="muted">${esc(clip((p.ctas || []).join(' · '), 58))}</span></td><td class="nw"><a href="${esc(p.profile)}">Page&nbsp;↗</a><br><a href="${libLink(p.pid)}">Ads&nbsp;↗</a></td></tr>`).join('')}
  </tbody></table>`;
}

/* ---------- assemble ---------- */
const readSec = SECS.find(s => /^the read/i.test(s.short));
const readItems = (() => { const items = []; let cur = null;
  for (const l of (readSec?.body || '').split('\n')) { const m = l.match(/^\d+\.\s+(.*)$/); if (m) { cur = { raw: m[1] }; items.push(cur); } else if (cur && l.trim()) cur.raw += ' ' + l.trim(); else if (!l.trim()) cur = null; }
  return items.map(it => { const m = it.raw.match(/^\*\*(.+?)\*\*\s*(.*)$/); return m ? { title: m[1], body: m[2] } : { title: it.raw, body: '' }; }); })();
const headMd = (SECS[0].body || '').split('\n').filter(l => !/^#\s/.test(l)).join('\n');
const BLOCKS = CALL_MODE ? [
  { re: /^who (is running|runs)/i, title: `Every page running ACA call offers — ${offerPages.length}`, toc: `a table of all ${offerPages.length} pages, with links`,
    note: 'Ranked by duplication × age. <b>Call offers</b> shows that page’s call-offer ads out of all its ACA ads. <b>Page ↗</b> opens the Facebook page; <b>Ads ↗</b> opens its full active library.', html: () => offerPageTable(offerPages) },
  { re: /^the call offers/i, sub: /^(every|top) call offer/i, title: `The call offers — top ${callCards.length} creatives`, toc: `the top ${callCards.length} call-offer creatives`,
    note: 'ACA-explicit ads whose conversion is an inbound phone call, ranked by duplication × days alive. Near-identical copies count once.', html: () => cards(callCards, 'call') },
  { re: /^(languages|spanish)/i, title: `Non-English call offers — top ${langCards.length}`, toc: `${langCards.length} non-English call offers`,
    note: 'Spanish, Vietnamese and other-language ACA call offers, ranked by duplication × days alive, at most three per page.', html: () => cards(langCards, 'lang') },
  { re: /^offer structure/i, title: `Most aggressive call offers — top ${aggCards.length}`, toc: `the ${aggCards.length} most aggressive call offers`,
    note: 'Call offers ranked by aggressiveness — the weighted pressure devices in the copy and voiceover — then urgency, RVERT and duplication.', html: () => cards(aggCards, 'agg') },
] : [
  { re: /^the call cut/i, sub: /^top call-driven creatives/i, title: `Top ${callCards.length} call-driven creatives`,
    note: 'Every creative wired for a phone call — Meta Call Now button, a number written into the copy, a <code>tel:</code> link, or an explicit call ask — ranked by duplication × days alive. Near-identical copies count once; Medicare and other off-niche leaks are removed.', html: () => cards(callCards, 'call'), toc: `the top ${callCards.length} call-driven creatives` },
  { re: /^the anti-call/i, title: `The anti-call creatives — top ${antiCards.length}`,
    note: 'Ads that explicitly promise no phone call, ranked by duplication × days alive. One card per distinct piece of copy; the dup figure adds up every clone across the cluster’s pages.', html: () => cards(antiCards, 'anti'), toc: `${antiCards.length} anti-call creatives` },
  { re: /^spanish/i, title: `Spanish and Vietnamese creatives — top ${langCards.length}`,
    note: 'Non-English ACA creatives ranked by duplication × days alive, at most three per page. Watch the CTA line: WhatsApp and a written number, almost never the Call Now button.', html: () => cards(langCards, 'lang'), toc: `${langCards.length} Spanish and Vietnamese creatives` },
  { re: /^best performing hooks/i, title: `Most aggressive ACA offers — top ${aggCards.length}`,
    note: 'Ranked by aggressiveness — the weighted pressure devices each ad uses — then urgency, RVERT and duplication. At most three per page; Medicare, hiring and school-enrollment leaks removed. Aggressiveness reads the copy, not the call wiring: most of these end in a form.', html: () => cards(aggCards, 'agg'), toc: `the ${aggCards.length} most aggressive ACA offers` },
  { re: /^advertiser pages/i, title: `Advertiser pages to check — top ${pageRows.length}`,
    note: 'Pages ranked by call-driven, anti-call and WhatsApp ads combined, then ACA volume. <b>Page ↗</b> opens the Facebook page; <b>Ads ↗</b> opens that page’s full active library. Highlighted rows run call-driven ads.', toc: `the top ${pageRows.length} pages to check, with links`, html: () => pageTable(pageRows) + (quietRows.length ? `<h3>Largest ACA advertisers with no call, anti-call or WhatsApp ads</h3>${pageTable(quietRows)}` : ''), raw: true },
];
const parts = [];
const toc = [`The read — ${readItems.length} findings`];
const tocName = s => s.replace(/\s+—.*$/, '').replace(/:.*$/, '').replace(/[*`_]/g, '').trim();
for (const s of SECS.slice(1)) {
  if (!s.title || /^the read/i.test(s.short)) continue;
  const b = BLOCKS.find(x => x.re.test(s.short));
  const eyebrow = s.num ? `Section ${s.num}` : 'Reference';
  let body = null;
  if (b && b.sub) { const sp = splitSub(s.body, b.sub);
    if (sp) body = mdBlocks(sp.before) + `<h3>${esc(b.title)}</h3><p class="muted">${b.note}</p>${b.html()}` + mdBlocks(sp.body.split('\n').filter(l => !/^\|/.test(l)).join('\n')) + mdBlocks(sp.after); }
  if (!body) body = mdBlocks(s.body);
  parts.push(`<section class="${s.body.length > 900 || b ? 'section' : 'flow'}"><div class="eyebrow">${esc(eyebrow)}</div><h2>${mdInline(s.short)}</h2>${body}</section>`);
  if (!/^files/i.test(s.short)) toc.push(tocName(s.short) + (b ? ` — with ${b.toc}` : ''));
  if (b && !b.sub) parts.push(`<section class="section"><div class="eyebrow">${esc(eyebrow)}b</div><h2>${esc(b.title)}</h2><div class="sub">${b.note}</div>${b.html()}</section>`);
}
toc.push(CALL_MODE ? 'Appendix — spoken scripts of the call-offer videos' : 'Appendix — spoken scripts of the call-driven videos');
const COVER_TITLE = RC.cover_title || LABEL.replace(/\s+—\s+pay-per-call$/i, '');

const pdfSrc = (() => { try { return fs.readFileSync(path.join(HERE, 'pdf.mjs'), 'utf8'); } catch { return ''; } })();
const baseCss = (pdfSrc.match(/const css = `([\s\S]*?)`;/) || [])[1] || `
@page { size: Letter; margin: 0.5in 0.55in 0.62in; } * { box-sizing: border-box; } html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 9.6pt/1.45 -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1b1d22; } h2 { font-size: 17pt; margin: 0 0 4pt; } h3 { font-size: 11pt; margin: 14pt 0 6pt; }
a { color: #1f5fd6; text-decoration: none; } .muted { color: #8a8f9c; } .section { break-before: page; } .eyebrow { font-size: 7.6pt; font-weight: 700; text-transform: uppercase; color: #c2410c; }
table { width: 100%; border-collapse: collapse; font-size: 8.6pt; } th { text-align: left; border-bottom: 1.5px solid #1b1d22; padding: 4pt 6pt; } td { border-bottom: 1px solid #eceef2; padding: 4pt 6pt; vertical-align: top; }
.card { display: grid; grid-template-columns: 1.3in 1fr; gap: 12pt; border: 1px solid #e3e5ea; border-radius: 7pt; padding: 9pt; break-inside: avoid; margin-bottom: 9pt; } .thumb img { width: 100%; }
.pill { display: inline-block; font-size: 7pt; padding: 1pt 5pt; border-radius: 99pt; background: #eef0f4; margin: 0 2pt 2pt 0; } .callout { background: #f5f6f9; border-radius: 6pt; padding: 10pt 12pt; margin: 8pt 0; }`;
const css = baseCss + `
.flow { margin-top: 22pt; }
.cover h1 { font-size: 31pt; margin-top: 0.85in; }
ul.toc { columns: 2; column-gap: 18pt; font-size: 8.8pt; } ul.toc li { break-inside: avoid; }
.pill.call { background: #e7f6ec; color: #17663a; }
.pill.phone { background: #1b1d22; color: #fff; }
.pill.anti { background: #fdecea; color: #b42318; }
.pill.lang { background: #efe9fb; color: #5b3aa6; }
.hook.ttl { font-size: 8.4pt; color: #33384a; }
table.pages { font-size: 7.5pt; }
table.pages th, table.pages td { padding: 3.4pt 4pt; }
td.nw { white-space: nowrap; }
code { font-size: 8pt; background: #f1f2f5; padding: 0 2.5pt; border-radius: 2.5pt; }
.stat .l b { color: inherit; }
`;
const tot = C?.total || {}, anti = C?.anti_call || {};
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(LABEL)} · Meta Ad Library · ${DATE}</title><style>${css}</style></head><body>
<section class="cover">
  <div class="brand">Meta Ad Library Research · pay-per-call</div>
  <h1>${esc(COVER_TITLE)}</h1>
  <div class="date">Competitor scan · run ${DATE} · ${CALL_MODE ? 'call offers only' : 'the call cut first'}</div>
  <div class="stats">
    ${CALL_MODE ? `<div class="stat"><div class="n">${n0(OFF.scope.harvested_ads)}</div><div class="l">ads harvested</div></div>
    <div class="stat"><div class="n">${n0(OFF.scope.aca_ads)}</div><div class="l">ACA ads · not general health, not Medicare</div></div>
    <div class="stat hot"><div class="n">${n0(OFF.scope.call_offer_ads)}</div><div class="l">ACA call offers · ${n0(OFF.scope.call_offer_active)} active</div></div>
    <div class="stat hot"><div class="n">${n0(OFF.scope.call_offer_pages)}</div><div class="l">pages running them</div></div>` : `<div class="stat"><div class="n">${n0(A.totals.ads)}</div><div class="l">ads harvested</div></div>
    <div class="stat"><div class="n">${n0(A.totals.niche_ads)}</div><div class="l">on-niche ACA ads · ${n0(A.totals.niche_pages)} pages</div></div>
    <div class="stat hot"><div class="n">${n0(tot.call_ads)}</div><div class="l">ask for a phone call (${tot.call_share ?? '—'}%)</div></div>
    <div class="stat hot"><div class="n">${n0(anti.ads)}</div><div class="l">promise <b>no</b> call · ${n0((anti.pages || []).length)} pages</div></div>`}
  </div>
  ${readItems[0] ? `<div class="headline"><b>${mdInline(readItems[0].title)}</b> ${mdInline(clip(readItems[0].body, 360))}</div>` : ''}
  <h3 style="margin-top:16pt">In this report</h3><ul class="tight toc">${toc.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  ${CALL_MODE ? `<div class="callout"><b>What counts as an ACA call offer</b>The ad names the ACA — Obamacare, the Affordable Care Act, the marketplace, premium tax credits or subsidies, or a state exchange — in its copy, voiceover or on-screen text, and its conversion is an inbound phone call: Meta’s Call Now button, a phone number in the ad, a <code>tel:</code> link, or a landing page that is a call lander. Forms, quizzes, chat and booking funnels are lead gen and are left out, as are general health insurance, private PPO and Medicare ads.</div>` : ''}
  <div class="callout"${CALL_MODE ? ' hidden' : ''}><b>How a call ad is detected</b>An ad counts as <b style="display:inline">call-driven</b> when it carries Meta’s Call Now button, a phone number written into the copy, a <code>tel:</code> link in its extra links, or an explicit call ask (“call now”, “speak to a licensed agent”, “llámanos”). The Ad Library shows that a Call Now button exists, never its number. Ads that explicitly promise <b style="display:inline">no</b> phone call are tracked separately and never counted as call-driven on wording alone.</div>
  <div class="note">${A.baseline ? 'Baseline run — no prior week, so no week-over-week deltas yet.' : `Compared with the run of ${esc(A.prev_date || '—')}.`} Harvested logged-out; landing pages read, never submitted. RVERT is a structural read of each offer, not measured performance — read it next to lifespan and duplication, which are the advertiser’s own money talking.</div>
</section>
<section class="section">
  <div class="eyebrow">Summary</div><h2>The read</h2><div class="sub">What the ACA call market on Meta looks like, and what to do about it.</div>
  ${mdBlocks(readSec?.body || '')}
  <h3>About this run</h3>${mdBlocks(headMd)}
  <div class="callout"><b>How to read the scores</b>RVERT = <b>((R × V) − (E + Rk)) ÷ √T × U</b> — Real (believability), Value (payoff vs the anchor), Energy and Risk (friction), Time to the promised payoff, and Urgency. It scores the structure of the offer. <b>Lifespan and duplication are the real verdict</b>: a high score at 3 days is a hypothesis; the same score at 60 days and x50 is a conclusion.</div>
</section>
${parts.join('\n')}
<section class="section">
  <div class="eyebrow">Appendix</div><h2>Spoken scripts — ${CALL_MODE ? 'ACA call-offer videos' : 'call-driven videos'}</h2>
  <div class="sub">Full voiceover transcripts for the call-driven ACA videos, strongest evidence first. Copy the structure, not the words.</div>
  ${scriptRows.map(x => `<div class="script"><h4>${esc(trimName(x.page))} <span class="muted">· ${Math.round(lifeOf(x))}d · x${x.family_coll} · ${esc((x.call_signals || []).map(s => SIG[s] || s).join(', '))}${x.phone ? ' · ' + esc(fmtPhone(x.phone)) : ''} · <a href="${esc(x.link)}">ad ↗</a></span></h4><p>${esc(clip(K[x.hash].text, 1800))}</p></div>`).join('')}
</section>
</body></html>`;
const htmlPath = path.join(RUN, `report-${DATE}.html`);
fs.writeFileSync(htmlPath, html);

/* ---------- print with an isolated headless Chrome (same recipe as pdf.mjs) ---------- */
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const raw = path.join(TMP, 'raw.pdf');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-print-profile-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--use-mock-keychain', '--password-store=basic',
  '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--no-pdf-header-footer', `--print-to-pdf=${raw}`, 'file://' + htmlPath], { stdio: 'ignore', detached: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = -1, stable = 0; const deadline = Date.now() + 150000;
while (Date.now() < deadline) { await sleep(1000); const size = fs.existsSync(raw) ? fs.statSync(raw).size : 0; if (size > 0 && size === last) { if (++stable >= 2) break; } else stable = 0; last = size; }
try { process.kill(-chrome.pid, 'SIGTERM'); } catch { try { chrome.kill('SIGTERM'); } catch {} }
await sleep(500);
fs.rmSync(profile, { recursive: true, force: true });
if (!fs.existsSync(raw) || fs.statSync(raw).size === 0) { console.error('Chrome produced no PDF within 150s'); process.exit(1); }
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
w.add_metadata({"/Title": sys.argv[3], "/Author": "AdLibraryResearch research", "/Subject": "Meta Ad Library pay-per-call scan"})
with open(sys.argv[2], "wb") as f: w.write(f)
print(n)
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const pages = execFileSync('python3', ['-c', py, raw, OUT, `${LABEL} · Meta Ad Library · ${DATE}`]).toString().trim();
fs.rmSync(TMP, { recursive: true, force: true });
fs.copyFileSync(OUT, path.join(RUN, `report-${DATE}.pdf`));
console.log(JSON.stringify({ ok: true, out: OUT, pages: +pages, bytes: fs.statSync(OUT).size, archived: path.join(RUN, `report-${DATE}.pdf`), html: htmlPath,
  cards: { call: callCards.length, anti: antiCards.length, lang: langCards.length, aggressive: aggCards.length }, page_rows: pageRows.length, scripts: scriptRows.length }, null, 2));
