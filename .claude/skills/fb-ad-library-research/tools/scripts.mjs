#!/usr/bin/env node
/* Fold whisper transcripts + frame OCR into scripts.json, keyed by creative hash.
 * Separates the two kinds of hook a video ad actually has:
 *   spoken_hook  — first sentence of the voiceover (whisper)
 *   screen_hook  — the on-screen text in the first 3 seconds (tesseract OCR)
 * Many roofing ads are music-only text-on-screen, so a video with no spoken
 * hook is normal, not a failed transcription — `voice: false` records that.
 * Usage: node scripts.mjs --niche roofing --date 2026-09-11
 */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const argv = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const NICHE = argv.niche || 'roofing';
const DATE = argv.date || new Date().toISOString().slice(0, 10);
const ROOT = argv.root || path.join(os.homedir(), 'Documents/AdLibraryResearch/fb-ad-library');
const RUN = path.join(ROOT, NICHE, '_reports', DATE);

const NOISE = /^(music|silence|applause|\[.*\]|\(.*\)|thank you\.?|you)$/i;
const clean = s => s.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
// OCR of stylized ad type is noisy: keep only runs that look like real words.
const ocrClean = s => s.split('\n')
  .map(l => l.replace(/[^A-Za-z0-9$%'.,!?:\- ]/g, ' ').replace(/\s+/g, ' ').trim())
  .filter(l => l.length >= 8 && (l.match(/[A-Za-z]{3,}/g) || []).length >= 2)
  .filter(l => !/^(i{2,}|l{2,}|[a-z] ){3,}/i.test(l))
  .map(l => l.replace(/\b\w\b(?: \b\w\b)+/g, ' ').replace(/\s+/g, ' ').trim())
  .filter(l => l.length >= 8);

/* Transcripts and OCR live in the niche-level content-addressed stores
   (<niche>/_transcripts/<hash>.txt), shared across every run, so a creative
   carried over from a previous week is never re-transcribed. The run folder
   symlinks to them. Legacy <adId>-<hash>.txt names still resolve. */
const NICHE_DIR = path.join(ROOT, NICHE);
const read = (kind, hash, id) => {
  for (const p of [path.join(NICHE_DIR, '_' + kind, hash + '.txt'),
                   path.join(RUN, kind, hash + '.txt'),
                   path.join(RUN, kind, id + '-' + hash + '.txt')]) {
    try { return fs.readFileSync(p, 'utf8'); } catch {}
  }
  return '';
};
const manifest = (() => { try {
  return JSON.parse(fs.readFileSync(path.join(RUN, 'creatives-manifest.json'), 'utf8'));
} catch { return []; } })();

const out = {};
for (const c of manifest.filter(c => c.kind === 'video')) {
  const hash = c.hash, id = c.id;
  const text = clean(read('transcripts', hash, id));
  const words = text ? text.split(/\s+/).filter(w => !NOISE.test(w)).length : 0;
  // An empty transcript means the attempt ran and found nothing — a silent or
  // music-only ad, which is a real format in this niche, not a failed pass.
  const attempted = read('transcripts', hash, id) !== null;
  const voice = words >= 12;
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s && !NOISE.test(s));
  const ocrLines = ocrClean(read('ocr', hash, id));
  out[hash] = { id, hash, voice, words, no_voiceover: !voice,
    text: voice ? text : '',
    spoken_hook: voice ? (sentences[0] || '').slice(0, 240) : null,
    spoken_hook_2: voice ? (sentences[1] || '').slice(0, 240) : null,
    screen_hook: ocrLines.slice(0, 4),
    ocr_raw_lines: ocrLines.length };
}
fs.writeFileSync(path.join(RUN, 'scripts.json'), JSON.stringify(out, null, 2));
const v = Object.values(out);
console.log(JSON.stringify({ ok: true, videos: v.length, withVoice: v.filter(x => x.voice).length,
  noVoiceover: v.filter(x => !x.voice).length, withScreenText: v.filter(x => x.screen_hook.length).length }, null, 2));
