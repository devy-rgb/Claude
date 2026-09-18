#!/usr/bin/env node
/* Trace the landing-page pathway for the top ads: every redirect hop from the
 * ad's link to the page a homeowner actually lands on.
 *   node redirects.mjs --niche roofing --date 2026-09-11 [--n 20]
 * Writes <run>/landing-paths.json and landing-paths.md.
 *
 * Follows HTTP 3xx, <meta http-equiv=refresh>, and simple JS location
 * redirects (detected by pattern; page scripts are NEVER executed). GET only —
 * no form is ever submitted, no field filled.
 *
 * Each URL is traced twice: as mobile Safari, and as Facebook's in-app browser
 * with a facebook.com referrer (how a real ad click arrives). If the two end on
 * different hosts the funnel is CLOAKED — it shows reviewers and bots one page
 * and Facebook traffic another. That is itself a strong aggressive-affiliate
 * signal. Unfilled Meta macros ({{ad.id}}) are left as-is so no attribution
 * is forged into the advertiser's tracker.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { rankByAggressiveness, AGGRESSIVE_TOP_N, lifeOf } from './rank.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing', DATE = argv.date || new Date().toISOString().slice(0, 10), N = +(argv.n || 20);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);
const S = JSON.parse(fs.readFileSync(path.join(RUN, 'scored.json'), 'utf8'));

const UA = {
  mobile: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1' },
  facebook: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/512.0.0.41.109;FBBV/742394856;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
              referer: 'https://m.facebook.com/' },
};
const NICHE_WORD = NICHE === 'roofing' ? 'roof' : NICHE.split('-')[0];
const NATIVE = /^(fb\.me|fb\.com|m\.me|(www\.|m\.|l\.)?facebook\.com|(www\.)?instagram\.com|messenger\.com)$/i;
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

async function get(url, headers) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html,*/*', 'accept-language': 'en-US', ...headers }, signal: ctl.signal });
    const ct = r.headers.get('content-type') || '';
    let body = '';
    if (r.status >= 200 && r.status < 300 && /html|text/i.test(ct)) {
      const buf = Buffer.from(await r.arrayBuffer()); body = buf.subarray(0, 400000).toString('utf8');
    }
    return { status: r.status, location: r.headers.get('location'), body, ct };
  } catch (e) { return { status: 0, error: e.name === 'AbortError' ? 'timeout' : String(e.message || e).slice(0, 80) }; }
  finally { clearTimeout(t); }
}

function softRedirect(body, base) {
  const meta = body.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*?url=([^"'>\s]+)/i)
            || body.match(/<meta[^>]+content=["'][^"']*?url=([^"'>\s]+)["'][^>]*http-equiv=["']?refresh/i);
  if (meta) return { to: new URL(meta[1].replace(/&amp;/g, '&'), base).href, via: 'meta-refresh' };
  const js = body.match(/(?:window\.|document\.|top\.)?location(?:\.href)?\s*=\s*["'`]([^"'`]{8,})["'`]/i)
          || body.match(/location\.(?:replace|assign)\(\s*["'`]([^"'`]{8,})["'`]\s*\)/i);
  if (js && !/^javascript:|^#/.test(js[1])) { try { return { to: new URL(js[1], base).href, via: 'js-redirect' }; } catch {} }
  return null;
}

async function trace(start, profile) {
  const hops = []; let url = start, soft = 0;
  for (let i = 0; i < 14; i++) {
    const r = await get(url, UA[profile]);
    const hop = { url, host: host(url), status: r.status, via: i === 0 ? 'ad link' : hops.length ? hops[hops.length - 1].next_via : 'ad link' };
    if (r.error) { hop.error = r.error; hops.push(hop); break; }
    if (r.status >= 300 && r.status < 400 && r.location) {
      hop.next_via = `http ${r.status}`; hops.push(hop); url = new URL(r.location, url).href; continue;
    }
    const s = r.body && soft < 3 ? softRedirect(r.body, url) : null;
    if (s && host(s.to) && s.to !== url) { hop.next_via = s.via; hops.push(hop); url = s.to; soft++; continue; }
    // final page facts (read-only)
    const b = r.body || '';
    hop.final = true;
    hop.title = ((b.match(/<title[^>]*>([^<]{0,160})/i) || [])[1] || '').replace(/\s+/g, ' ').trim()
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    hop.has_form = /<form\b/i.test(b);
    hop.asks_zip = /name=["']?(zip|zipcode|zip_code|postal)|placeholder=["'][^"']*zip/i.test(b);
    hop.asks_phone = /type=["']?tel\b|name=["']?phone/i.test(b);
    hop.quiz_like = /step\s*\d+\s*(of|\/)\s*\d+|question\s*\d+|progress-?bar|multi-?step/i.test(b);
    hop.trackers = [...new Set((b.match(/(clickflare|redtrack|voluum|everflow|binom|keitaro|hyros|trackdesk|funnelflux)/gi) || []).map(x => x.toLowerCase()))];
    hops.push(hop); break;
  }
  const last = hops[hops.length - 1] || {};
  return { hops, final_url: last.url, final_host: last.host, final_status: last.status, error: last.error || null };
}

const aggressive = rankByAggressiveness(S, +(argv['agg-n'] || AGGRESSIVE_TOP_N));   // same list the report shows
const fresh = S.filter(x => lifeOf(x) < 14 && x.family_coll >= 3).sort((a, b) => b.family_coll - a.family_coll).slice(0, N);
const ads = new Map(); for (const x of [...aggressive, ...fresh]) ads.set(x.id, x);
const byUrl = new Map();
for (const x of ads.values()) { if (!x.url) continue; (byUrl.get(x.url) || byUrl.set(x.url, []).get(x.url)).push(x); }

const results = {};
const queue = [...byUrl.keys()];
async function worker() {
  while (queue.length) {
    const u = queue.shift(); const h = host(u);
    if (!h || NATIVE.test(h)) { results[u] = { native: true, note: 'Native Facebook destination (lead form / Messenger) - no off-platform page' }; continue; }
    const [m, f] = await Promise.all([trace(u, 'mobile'), trace(u, 'facebook')]);
    // Cloaked if the two visitor types land on different sites, OR if even the
    // Facebook-style click is bounced to a search engine — the classic cloaker
    // "safe" redirect for traffic that fails its filter. We do not try to get
    // past the filter (no forged ad ids, no fake fbclid): the bounce IS the finding.
    const bounced = /^(google|bing|yahoo|duckduckgo)\.[a-z.]+$/i.test(f.final_host || '');
    const cloaked = bounced || !!(m.final_host && f.final_host && m.final_host !== f.final_host);
    const allUrls = f.hops.map(h => h.url).join(' ');
    const tracker = /\/cf\/r\//.test(allUrls) ? 'ClickFlare' : /rtkcid=|rtkcmpid=/.test(allUrls) ? 'RedTrack'
      : /[?&](cep|lptoken)=/.test(allUrls) ? 'ClickFlare'
      : /[?&]o=\d+.*[?&]a=\d+.*[?&]s1=/.test(allUrls) ? 'Everflow-style (o/a/c/s1 params)'
      : /voluum\.com|[?&]cpid=/.test(allUrls) ? 'Voluum-style' : null;
    const fin = f.hops.find(h => h.final) || {};
    const finText = `${fin.title || ''} ${f.final_url || ''}`;
    const nicheWord = new RegExp(NICHE_WORD, 'i');
    const other = (finText.match(/\b(bath(room)?|shower|walk[- ]?in tub|window|siding|gutter|solar|hvac|flooring|kitchen|insurance|auto|car)\b/i) || [])[1];
    const offer_mismatch = !bounced && fin.title !== undefined && !nicheWord.test(finText) && other ? other.toLowerCase() : null;
    results[u] = { mobile: m, facebook: f, cloaked, bounced, tracker, offer_mismatch,
      pathway: f.hops.map(x => x.host).filter((v, i, a) => v && v !== a[i - 1]).join(' -> '),
      redirect_count: Math.max(0, f.hops.length - 1) };
    process.stderr.write(`${cloaked ? 'CLOAKED ' : ''}${results[u].pathway || u}\n`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

const cell = v => String(v ?? '').replace(/\|/g, '/');
const rows = [...ads.values()].map(x => ({ id: x.id, page: x.page, bucket: x.bucket, score: x.score, life: lifeOf(x), dup: x.family_coll,
  in_aggressive_top: aggressive.some(a => a.id === x.id), in_new_launches: fresh.some(a => a.id === x.id),
  ad_link: x.link, landing_url: x.url, ...(x.url ? results[x.url] : { native: true, note: 'no landing URL on the ad' }) }));
fs.writeFileSync(path.join(RUN, 'landing-paths.json'), JSON.stringify({ date: DATE, traced_at: new Date().toISOString(), rows }, null, 2));

const md = [`# Landing pathways — ${NICHE} · ${DATE}`, '',
  `Traced ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${byUrl.size} unique ad links · top ${aggressive.length} most aggressive + top ${fresh.length} new launches.`,
  'Each link followed as a Facebook in-app click (FB user-agent + facebook.com referrer) and again as mobile Safari.',
  '**CLOAKED** = the two end on different sites — reviewers and Facebook users are shown different pages.', '',
  '| Page | Score | Pathway (as a Facebook click) | Hops | Final page | Form | Cloaked |', '|---|---|---|---|---|---|---|'];
for (const r of rows) {
  if (r.native) { md.push(`| ${r.page} | ${r.score} | _native — ${r.note}_ | 0 | — | — | — |`); continue; }
  const fin = (r.facebook.hops.find(h => h.final) || {});
  const form = [fin.asks_zip && 'zip', fin.asks_phone && 'phone', fin.quiz_like && 'multi-step'].filter(Boolean).join(', ') || (fin.has_form ? 'form' : '—');
  const cl = r.bounced ? '**yes** — bounces to google.com' : r.cloaked ? `**yes** — Safari lands on ${r.mobile.final_host}` : 'no';
  const mm = r.offer_mismatch ? ` ⚠️ **routes to a ${r.offer_mismatch} offer**` : '';
  md.push(`| ${cell(r.page)} | ${r.score} | ${r.pathway || '—'}${r.tracker ? ` _(${r.tracker})_` : ''}${r.facebook.error ? ` _(${r.facebook.error})_` : ''} | ${r.redirect_count} | ${r.bounced ? '—' : cell(fin.title || r.facebook.final_host || '—').slice(0, 55)}${mm} | ${r.bounced ? '—' : form} | ${cl} |`);
}
fs.writeFileSync(path.join(RUN, 'landing-paths.md'), md.join('\n'));
const traced = Object.values(results).filter(r => !r.native);
console.log(JSON.stringify({ ok: true, ads: rows.length, unique_links: byUrl.size, traced: traced.length,
  with_redirects: traced.filter(r => r.redirect_count > 0).length, cloaked: traced.filter(r => r.cloaked).length,
  offer_mismatch: traced.filter(r => r.offer_mismatch).length,
  trackers: [...new Set(traced.map(r => r.tracker).filter(Boolean))],
  errors: traced.filter(r => r.facebook.error).length }, null, 2));
