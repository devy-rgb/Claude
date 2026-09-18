#!/usr/bin/env node
/* Landing-page check for pay-per-call niches: is the page a CALL lander or lead gen?
 * Fetches each distinct landing URL of the run's on-niche ads ONCE: a plain GET with a mobile
 * Safari user agent, redirects followed, 15s timeout. No click IDs are forged and nothing is
 * submitted, so a cloaked funnel shows whatever it shows a stranger — recorded, never worked around.
 *   call    tel: links or a call-tracking script, and no lead form
 *   mixed   a call path AND a lead form
 *   form    lead form / survey / quiz / booking, no call path
 *   chat    WhatsApp or Messenger hand-off (not fetched)
 *   native  facebook.com / fb.me / instagram destination (not fetched)
 *   site    reachable page with neither (exchange, carrier or agency homepage)
 *   blocked non-200, bot wall, or near-empty body (JS-only or cloaked)
 * Writes landers.json (keyed by host+path) and landers.md.
 *   node landers.mjs --niche aca-pay-per-call --date 2026-09-15
 * Owned by the ACA pay-per-call session; not part of run.sh.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { loadNiche, relevanceFn } from './lib.mjs';
const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); args[k] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; } }
const NICHE = args.niche || 'aca-pay-per-call', DATE = args.date || new Date().toISOString().slice(0, 10);
const ROOT = args.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const isRelevant = relevanceFn(loadNiche(NICHE));
const ads = new Map();
for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')).sort())
  for (const a of (rd(path.join(RUN, 'raw', f), []) || [])) if (a && a.id && !ads.has(a.id)) ads.set(a.id, a);
export const urlKey = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, ''); } catch { return null; } };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
// word-bounded: "timelocale" must not read as eLocal
const VENDORS = /\b(ringba|retreaver|invoca|callrail|trackdrive|marchex|dialogtech|convoso|phonexa|calltrackingmetrics|tctm\.co|callgear|ringpartner|elocal\.com)\b/gi;
const CALL_CTA = /\b(call now|tap to call|click to call|call today|call us (now|today)|speak (to|with) a licensed|llame (ahora|hoy)|ll[aá]ma(nos)? (ahora|hoy)|ll[aá]manos|gọi ngay)\b/i;
const FORMWIDGET = /leadconnectorhq|msgsndr|widget\/(survey|form|booking)|typeform|jotform|formstack|hsforms|cognitoforms|heyflow|involve\.me|leadshook|perspective\.co|convertflow|calendly|acuityscheduling/i;
const QUIZ = /step \d+ of \d+|question \d+ of \d+|enter (your )?zip|what is your zip|zip code/i;
const PHONE = /\(?\b[2-9]\d{2}\)?[-. ]\d{3}[-. ]\d{4}\b|\b1[-. ]?8(00|33|44|55|66|77|88)[-. ]?\d{3}[-. ]?\d{4}\b/g;
const digits = s => { const d = String(s || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? d : null; };
const targets = new Map();
for (const a of ads.values()) {
  if (!isRelevant(a) || !a.url || /^tel:/i.test(a.url)) continue;
  const k = urlKey(a.url); if (!k) continue;
  const t = targets.get(k) || { key: k, url: a.url, ads: 0, pages: new Set() }; t.ads++; t.pages.add(a.page); targets.set(k, t);
}
async function check(t) {
  const host = t.key.split('/')[0];
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host) || /^m\.me$/.test(host)) return { class: 'chat' };
  if (/(^|\.)(facebook\.com|fb\.me|fb\.com|instagram\.com)$/.test(host)) return { class: 'native' };
  const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(t.url, { redirect: 'follow', signal: ac.signal, headers: { 'user-agent': UA, 'accept': 'text/html,application/xhtml+xml', 'accept-language': 'en-US,en;q=0.9' } });
    const html = (await r.text()).slice(0, 1500000); clearTimeout(timer);
    const final = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return host; } })();
    const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const tel = [...new Set([...html.matchAll(/href\s*=\s*["']tel:([^"']+)/gi)].map(m => digits(decodeURIComponent(m[1]))).filter(Boolean))];
    const phones = [...new Set((visible.match(PHONE) || []).map(digits).filter(Boolean))].slice(0, 6);
    const vendors = [...new Set((html.match(VENDORS) || []).map(v => v.toLowerCase()))];
    const inputs = (html.match(/<input\b[^>]*type\s*=\s*["']?(text|email|tel|number)\b/gi) || []).length;
    const form = (/<form\b/i.test(html) && inputs >= 2) || FORMWIDGET.test(html) || QUIZ.test(visible);
    const title = ((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const chat = /wa\.me\/|api\.whatsapp\.com|m\.me\//i.test(html);
    const anchors = (html.match(/<a\b/gi) || []).length;
    // a CALL lander makes the phone call its main action: a call-tracking script, or a tel: link on a thin page
    // (few links) or next to explicit call wording. A full website with a number in its header or footer is a site.
    const callPath = vendors.length > 0 || (tel.length > 0 && (anchors <= 25 || CALL_CTA.test(visible)));
    let cls;
    if (!r.ok || visible.length < 200) cls = 'blocked';
    else if (callPath && form) cls = 'mixed';
    else if (callPath) cls = 'call';
    else if (form) cls = 'form';
    else if (chat) cls = 'chat';
    else cls = 'site';
    return { class: cls, status: r.status, final_host: final, title, tel, phones, vendors, form, inputs, chat, anchors, call_cta: CALL_CTA.test(visible), form_marker: form ? ((html.match(FORMWIDGET) || visible.match(QUIZ) || ['<form>'])[0]) : null };
  } catch (e) { clearTimeout(timer); return { class: 'blocked', error: String(e.name || e).slice(0, 60) }; }
}
const list = [...targets.values()]; const out = {}; let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => { while (i < list.length) { const t = list[i++]; out[t.key] = { ...(await check(t)), ads: t.ads, pages: [...t.pages].slice(0, 6), url: t.url }; } }));
const tally = Object.values(out).reduce((m, x) => (m[x.class] = (m[x.class] || 0) + 1, m), {});
fs.writeFileSync(path.join(RUN, 'landers.json'), JSON.stringify({ date: DATE, checked: list.length, tally, landers: out }, null, 2));
const q = s => String(s ?? '').replace(/\|/g, '\\|');
const md = [`# Landing pages — ${NICHE} · ${DATE}`, '', `${list.length} distinct landing URLs checked (GET only, mobile UA, nothing submitted). ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(' · ')}`, '',
  '| Class | Ads | Final host | Tel links | Phones on page | Call tracking | Form | Title | Pages |', '|---|---|---|---|---|---|---|---|---|']
  .concat(Object.entries(out).sort((a, b) => b[1].ads - a[1].ads).map(([k, x]) => `| ${x.class} | ${x.ads} | ${q(x.final_host || k.split('/')[0])} | ${(x.tel || []).join(' ')} | ${(x.phones || []).slice(0, 3).join(' ')} | ${(x.vendors || []).join(', ')} | ${x.form ? q(x.form_marker) : ''} | ${q(x.title)} | ${q((x.pages || []).join(', '))} |`));
fs.writeFileSync(path.join(RUN, 'landers.md'), md.join('\n'));
console.log(JSON.stringify({ ok: true, checked: list.length, tally }, null, 2));
