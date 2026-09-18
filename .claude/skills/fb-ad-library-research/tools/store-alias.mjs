#!/usr/bin/env node
/* Keep the content-addressed media store readable when the creative-id scheme changes.
 *   node store-alias.mjs --niche roofing --date 2026-09-11
 *
 * The roofing store (_creatives/_transcripts/_ocr/_frames) was built on 2026-09-11 with
 * the original creative hash: sha1(norm(body)|norm(title)|fmt). lib.mjs's shared `chash`
 * (adopted 2026-09-12 for every niche) also folds US state names, so any creative whose
 * copy names a state got a new id — its media and voiceover transcript silently stopped
 * joining (roofing: 103 creatives, 52 transcripts), dropping every tactic detected from
 * the voiceover.
 *
 * This maps each creative in creatives-manifest.json back to the legacy id(s) of the
 * same raw ads and creates RELATIVE SYMLINKS under the new id for whatever is stored
 * under the legacy one. Nothing is downloaded, transcribed, copied, overwritten or
 * deleted; niches whose ids already match (built after the switch) are a no-op.
 * Must run after manifest.mjs and before scripts.mjs / score.mjs.
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
import { loadNiche, relevanceFn, copyFn, chash, norm } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing', DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const BASE = path.join(ROOT, NICHE), RUN = path.join(BASE, '_reports', DATE);
const out = o => console.log(JSON.stringify(o, null, 2));
const legacyHash = a => crypto.createHash('sha1').update(norm(a.body) + '|' + norm(a.title) + '|' + (a.fmt || '')).digest('hex').slice(0, 16);

const manifest = (() => { try { return JSON.parse(fs.readFileSync(path.join(RUN, 'creatives-manifest.json'), 'utf8')); } catch { return null; } })();
if (!manifest) { out({ ok: true, status: 'no_manifest' }); process.exit(0); }
const DIRS = { media: path.join(BASE, '_creatives'), tx: path.join(BASE, '_transcripts'), ocr: path.join(BASE, '_ocr'), frames: path.join(BASE, '_frames') };
if (!fs.existsSync(DIRS.media)) { out({ ok: true, status: 'no_store' }); process.exit(0); }

const cfg = loadNiche(NICHE), rel = relevanceFn(cfg), cp = copyFn(cfg);
const legacyOf = new Map();                                      // new id -> Map(legacy id -> [ad ids])
try {
  for (const f of fs.readdirSync(path.join(RUN, 'raw')).filter(f => f.endsWith('.json')))
    for (const a of JSON.parse(fs.readFileSync(path.join(RUN, 'raw', f), 'utf8'))) {
      if (!rel(a) || !cp(a) || (!a.vid && !a.img)) continue;
      const n = chash(a), l = legacyHash(a); if (n === l) continue;
      const m = legacyOf.get(n) || legacyOf.set(n, new Map()).get(n);
      (m.get(l) || m.set(l, []).get(l)).push(a.id);
    }
} catch (e) { out({ ok: false, error: 'raw unreadable: ' + e.message }); process.exit(0); }

const exists = p => { try { fs.statSync(p); return true; } catch { return false; } };   // follows links
const link = (target, at) => {
  if (exists(at) || !exists(target)) return false;
  try { fs.lstatSync(at); return false; } catch {}                                     // dangling link: leave it
  fs.symlinkSync(path.relative(path.dirname(at), target), at); return true;
};
const aliases = {}; let media = 0, tx = 0, ocr = 0, frames = 0;
for (const c of manifest) {
  const ext = c.kind === 'video' ? 'mp4' : 'jpg';
  if (exists(path.join(DIRS.media, `${c.hash}.${ext}`)) && (c.kind !== 'video' || exists(path.join(DIRS.tx, `${c.hash}.txt`)))) continue;
  const cands = [...(legacyOf.get(c.hash) || new Map()).entries()];
  if (!cands.length) continue;
  // prefer the legacy id of this creative's own representative ad, then one that has a transcript, then media
  const pick = cands.find(([, ids]) => ids.includes(c.id))?.[0]
    ?? cands.find(([l]) => exists(path.join(DIRS.tx, `${l}.txt`)))?.[0]
    ?? cands.find(([l]) => exists(path.join(DIRS.media, `${l}.${ext}`)))?.[0];
  if (!pick) continue;
  aliases[c.hash] = pick;
  if (link(path.join(DIRS.media, `${pick}.${ext}`), path.join(DIRS.media, `${c.hash}.${ext}`))) media++;
  if (link(path.join(DIRS.tx, `${pick}.txt`), path.join(DIRS.tx, `${c.hash}.txt`))) tx++;
  if (link(path.join(DIRS.ocr, `${pick}.txt`), path.join(DIRS.ocr, `${c.hash}.txt`))) ocr++;
  for (const t of ['0.5', '1.5', '3']) if (link(path.join(DIRS.frames, `${pick}-t${t}.jpg`), path.join(DIRS.frames, `${c.hash}-t${t}.jpg`))) frames++;
}
const aliasFile = path.join(DIRS.media, 'aliases.json');
const prev = (() => { try { return JSON.parse(fs.readFileSync(aliasFile, 'utf8')); } catch { return {}; } })();
if (Object.keys(aliases).length) fs.writeFileSync(aliasFile, JSON.stringify({ ...prev, ...aliases }, null, 2));
out({ ok: true, status: 'aliased', creatives_aliased: Object.keys(aliases).length, links: { media, transcripts: tx, ocr, frames } });
