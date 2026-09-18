#!/usr/bin/env node
/**
 * Meta Ad Library harvester — Playwright edition.
 *
 *   node tools/harvest.mjs --niche <niche> --date <YYYY-MM-DD> [--headed] [--slow]
 *
 * Drives a real, disposable, logged-out Chromium profile against the public
 * Facebook/Meta Ad Library, replays its own internal GraphQL search API with
 * our own query variables (same technique the site itself uses — nothing is
 * forged), and writes the deduplicated result set to
 *   ~/Documents/AdLibraryResearch/fb-ad-library/<niche>/_reports/<date>/raw/ads-01.json
 *
 * HARD RULES (see references/browser-safety.md):
 *   - Never a real/persistent browser profile. Always a fresh temp profile.
 *   - Abort immediately if the session looks logged in (c_user cookie).
 *   - Never solve a CAPTCHA, never click "Log in".
 *   - Never submit any form on the page.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadNiche } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const NICHE = args.niche || 'loan';
const DATE = args.date || new Date().toISOString().slice(0, 10);
const HEADED = !!args.headed;
const SLOW = !!args.slow;

const cfg = loadNiche(NICHE);
if (!cfg || !cfg.niche) {
  console.error(`No config at config/niches/${NICHE}.json — see RUNBOOK.md "Adding a niche".`);
  process.exit(1);
}

const BASE = path.join(os.homedir(), 'Documents', 'AdLibraryResearch', 'fb-ad-library', NICHE);
const RUN = path.join(BASE, '_reports', DATE);
const STATE_DIR = path.join(BASE, '_state');
fs.mkdirSync(path.join(RUN, 'raw'), { recursive: true });
fs.mkdirSync(STATE_DIR, { recursive: true });

const classFile = path.join(STATE_DIR, 'classification.json');
const classState = fs.existsSync(classFile) ? JSON.parse(fs.readFileSync(classFile, 'utf8')) : {};
classState.page_ids = classState.page_ids || {}; // name -> pid cache

const SLEEP_MS = SLOW ? [2000, 3000] : [900, 1500];
const CAP_KW = SLOW ? 100 : (cfg.caps?.per_keyword || 150);
const CAP_PAGE = SLOW ? 250 : (cfg.caps?.per_page || 400);
const COVERAGE_FLOOR = 5; // pages hit this many+ times in the keyword sweep get a full pull too

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function jitter([lo, hi]) { return lo + Math.random() * (hi - lo); }

async function main() {
  console.log(`→ harvesting "${NICHE}" for ${DATE} (${HEADED ? 'headed' : 'headless'}${SLOW ? ', slow mode' : ''})`);

  // A brand-new user-data-dir per run = a brand-new, cookie-free profile.
  // Nothing from a real FB session can leak in, and nothing here persists after.
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-adlib-'));
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: !HEADED,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });
  const page = await browser.newPage();

  const seedKw = (cfg.keywords?.core || [])[0] || cfg.niche;
  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(seedKw)}&search_type=keyword_unordered&media_type=all`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  // ---- Hard stop: never touch a logged-in session ----
  const cookieCheck = await page.evaluate(() => document.cookie.includes('c_user'));
  if (cookieCheck) {
    console.error('ABORT: c_user cookie present — this looks like a logged-in session. Never automate a logged-in FB profile.');
    await browser.close();
    process.exit(1);
  }

  // ---- Inject the in-page harvester (patches XHR, captures the GraphQL template, replays it) ----
  await page.evaluate(() => {
    if (window.__AL && window.__AL.ready) return;
    const W = (window.__AL = window.__AL || {});
    W.cap = { reqs: [] };
    W.store = new Map();
    const oOpen = XMLHttpRequest.prototype.open, oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (b) {
      if (this.__u && String(this.__u).includes('/api/graphql') && typeof b === 'string'
          && b.includes('AdLibrarySearchPaginationQuery')) W.cap.reqs.push(b);
      return oSend.apply(this, arguments);
    };
    W.assertAnonymous = () => {
      if (document.cookie.includes('c_user')) throw new Error('ABORT: logged-in session detected mid-run');
      return true;
    };
    W.arm = async function (tries = 10) {
      W.assertAnonymous();
      for (let i = 0; i < tries && !W.cap.reqs.length; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 2500));
      }
      if (!W.cap.reqs.length) throw new Error('no AdLibrarySearchPaginationQuery captured — is the page showing results?');
      const p = new URLSearchParams(W.cap.reqs[0]);
      W.BASE = {}; for (const [k, v] of p.entries()) W.BASE[k] = v;
      W.BASEVARS = JSON.parse(W.BASE.variables);
      W.ready = true;
      return 'armed';
    };
    W.q = async function (overrides, opts = {}) {
      W.assertAnonymous();
      const vars = Object.assign({}, W.BASEVARS,
        { cursor: null, first: opts.first || 30, sortData: null, collationToken: null }, overrides);
      const p = new URLSearchParams(W.BASE);
      p.set('variables', JSON.stringify(vars));
      const r = await fetch('https://www.facebook.com/api/graphql/', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: p.toString(),
      });
      const t = await r.text();
      let j; try { j = JSON.parse(t.split('\n')[0]); } catch { return { ok: false, err: 'unparseable', edges: [] }; }
      const c = j && j.data && j.data.ad_library_main && j.data.ad_library_main.search_results_connection;
      return {
        ok: !!c, edges: (c && c.edges) || [],
        cursor: (c && c.page_info && c.page_info.end_cursor) || null,
        hasNext: !!(c && c.page_info && c.page_info.has_next_page),
        err: j && j.errors && j.errors[0] && j.errors[0].message,
      };
    };
    const txt = v => (v && typeof v === 'object' ? (v.text || '') : (v || ''));
    W.distill = (n, src) => {
      const s = n.snapshot || {};
      const vid = (s.videos || [])[0] || {};
      const img = (s.images || [])[0] || {};
      const card = (s.cards || [])[0] || {};
      return {
        id: n.ad_archive_id, pid: n.page_id, page: n.page_name, act: !!n.is_active,
        start: n.start_date, end: n.end_date, coll: n.collation_count || 1,
        fmt: s.display_format || null, cta: s.cta_text || null, ctat: s.cta_type || null,
        url: s.link_url || card.link_url || null,
        title: (s.title || card.title || '').slice(0, 300),
        body: txt(s.body).slice(0, 1200) || txt(card.body).slice(0, 1200),
        cap: s.caption || card.caption || null,
        plat: n.publisher_platform || [], likes: s.page_like_count || null,
        cat: s.page_categories || n.categories || [],
        prof: s.page_profile_uri || null,
        vid: vid.video_sd_url || vid.video_hd_url || null,
        thumb: vid.video_preview_image_url || null,
        img: img.original_image_url || img.resized_image_url || null,
        src,
      };
    };
  });

  await page.evaluate(() => window.__AL.arm());
  console.log('  armed — GraphQL template captured');

  // ---- keyword sweep ----
  const keywords = [...(cfg.keywords?.core || []), ...(cfg.keywords?.angle || [])];
  const hitTally = new Map(); // pid -> hit count, for the coverage-gap full-pull pass
  let seen = 0;

  for (const kw of keywords) {
    let cursor = null, got = 0, pages = 0;
    while (got < CAP_KW && pages < 40) {
      const r = await page.evaluate(({ kw, cursor }) => window.__AL.q(
        { queryString: kw, searchType: 'keyword_exact_phrase', activeStatus: 'active', viewAllPageID: '0', pageIDs: [], cursor },
        { first: 30 },
      ), { kw, cursor });
      if (!r.ok) { console.log(`  kw:"${kw}" ERR ${r.err || '?'}`); break; }
      if (!r.edges.length) break;
      const added = await page.evaluate(({ edges, src }) => {
        let n = 0;
        for (const e of edges) for (const node of (e.node.collated_results || [])) {
          if (!window.__AL.store.has(node.ad_archive_id)) {
            window.__AL.store.set(node.ad_archive_id, window.__AL.distill(node, src));
            n++;
          }
        }
        return n;
      }, { edges: r.edges, src: `kw:${kw}` });
      for (const e of r.edges) for (const node of (e.node.collated_results || [])) {
        hitTally.set(node.page_id, (hitTally.get(node.page_id) || 0) + 1);
      }
      got += r.edges.length; pages++; seen += added;
      if (!r.hasNext || !r.cursor) break;
      cursor = r.cursor;
      await sleep(jitter(SLEEP_MS));
    }
    console.log(`  kw:"${kw}" seen=${got} pages=${pages}`);
  }

  // ---- resolve + pull configured seed pages ----
  const seedPages = cfg.seed_pages || [];
  for (const name of seedPages) {
    let pid = classState.page_ids[name];
    if (!pid) {
      const r = await page.evaluate((name) => window.__AL.q(
        { queryString: name, searchType: 'keyword_unordered', activeStatus: 'all', viewAllPageID: '0', pageIDs: [] },
        { first: 25 },
      ), name);
      const m = new Map();
      for (const e of (r.edges || [])) for (const node of (e.node.collated_results || [])) {
        if (!m.has(node.page_id)) m.set(node.page_id, { pid: node.page_id, page: node.page_name, n: 0 });
        m.get(node.page_id).n++;
      }
      const want = name.toLowerCase();
      const best = [...m.values()].sort((a, b) =>
        (b.page.toLowerCase() === want) - (a.page.toLowerCase() === want) || b.n - a.n)[0];
      if (!best) { console.log(`  page:"${name}" — no match found, skipping`); continue; }
      pid = best.pid;
      classState.page_ids[name] = pid;
      console.log(`  resolved "${name}" -> ${pid} (as "${best.page}")`);
      await sleep(jitter(SLEEP_MS));
    }
    hitTally.set(pid, CAP_PAGE); // force a full pull regardless of keyword-hit tally
  }

  // ---- coverage-gap pass: full viewAllPageID pull for any page seen enough in the sweep ----
  const toFullPull = [...hitTally.entries()].filter(([, n]) => n >= COVERAGE_FLOOR).map(([pid]) => pid);
  console.log(`  full-library pulls: ${toFullPull.length} pages`);
  for (const pid of toFullPull) {
    let cursor = null, got = 0, pages = 0;
    while (got < CAP_PAGE && pages < 40) {
      const r = await page.evaluate(({ pid, cursor }) => window.__AL.q(
        { queryString: '', searchType: 'page', viewAllPageID: String(pid), pageIDs: [String(pid)], activeStatus: 'active', cursor },
        { first: 30 },
      ), { pid, cursor });
      if (!r.ok) { console.log(`  page:${pid} ERR ${r.err || '?'}`); break; }
      if (!r.edges.length) break;
      const added = await page.evaluate(({ edges, src }) => {
        let n = 0;
        for (const e of edges) for (const node of (e.node.collated_results || [])) {
          if (!window.__AL.store.has(node.ad_archive_id)) {
            window.__AL.store.set(node.ad_archive_id, window.__AL.distill(node, src));
            n++;
          }
        }
        return n;
      }, { edges: r.edges, src: `page:${pid}` });
      got += r.edges.length; pages++; seen += added;
      if (!r.hasNext || !r.cursor) break;
      cursor = r.cursor;
      await sleep(jitter(SLEEP_MS));
    }
  }

  const all = await page.evaluate(() => [...window.__AL.store.values()]);
  fs.writeFileSync(path.join(RUN, 'raw', 'ads-01.json'), JSON.stringify(all, null, 0));
  fs.writeFileSync(classFile, JSON.stringify(classState, null, 2));
  console.log(`✅ wrote ${all.length} ads -> ${path.join(RUN, 'raw', 'ads-01.json')}`);

  await browser.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
}

main().catch(e => { console.error('harvest failed:', e); process.exit(1); });
