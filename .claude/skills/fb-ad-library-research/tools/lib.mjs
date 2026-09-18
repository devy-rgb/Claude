/* Shared helpers for the Ad Library tools. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';

export function loadNiche(niche) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  try { return JSON.parse(fs.readFileSync(path.join(dir, '..', 'config', 'niches', niche + '.json'), 'utf8')); }
  catch { return {}; }
}

/* Is this ad actually about the niche?
   Idioms are the main source of false positives — "all under one roof" appears
   in dental, HVAC and moving ads and has nothing to do with roofing. Excluded
   phrases are stripped from the text BEFORE the include test, so an ad that
   mentions roofing only inside an idiom correctly fails. */
export function relevanceFn(cfg) {
  const m = cfg.niche_match || {};
  if (!m.include) return () => true;
  const inc = new RegExp(m.include, 'i');
  const exc = m.exclude ? new RegExp(m.exclude, 'ig') : null;
  return (ad) => {
    const t = `${ad.body || ''} ${ad.title || ''} ${ad.page || ''} ${ad.url || ''}`;
    return inc.test(exc ? t.replace(exc, ' ') : t);
  };
}

/* DCO / catalog ads render as unresolved template vars and carry no real copy. */
export const PLACEHOLDER = /\{\{[^}]+\}\}/;
export const isCopy = (ad) => !PLACEHOLDER.test(ad.body || '') && ad.fmt !== 'DCO';
/* Per-niche version. In roofing, DCO ads rendered as unresolved template vars,
   so the format is dropped wholesale. In other niches (CCW: per-city class
   listings, an x47 info-product funnel) DCO carries real copy, so a config may
   set `analysis.keep_dco: true` and only placeholder bodies are dropped. */
export const copyFn = (cfg) => ((cfg || {}).analysis || {}).keep_dco
  ? (ad) => !PLACEHOLDER.test(ad.body || '') && !PLACEHOLDER.test(ad.title || '')
  : isCopy;

/* ---- creative identity (shared by analyze.mjs and manifest.mjs — never let these drift) ---- */
export const slug = s => String(s || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'unknown';
export const norm = s => String(s || '').toLowerCase()
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
  .replace(/\b\d[\d,.]*\b/g, '#').replace(/\s+/g, ' ').trim();
export const STATES = /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/g;
/* Creative hash: copy + title + format, normalised so geo/price swaps collapse. */
export const chash = a => crypto.createHash('sha1')
  .update(norm(a.body).replace(STATES, '@') + '|' + norm(a.title).replace(STATES, '@') + '|' + (a.fmt || ''))
  .digest('hex').slice(0, 16);

/* ---- per-niche rule overrides ----
   A niche config may carry `analysis.angles`, `analysis.triggers`,
   `analysis.rvert.{real,value,energy,risk,time,bold,aggression,urgency}` and
   `classify.{agg_name,program,quiz_funnel,tracker,track_param,brand_sig,trade_category}`.
   Regexes are strings: either a bare pattern (compiled with the default flags)
   or "/pattern/flags". A RegExp passes straight through, so the built-in
   roofing defaults compile identically. */
export function rx(s, flags = 'i') {
  if (s instanceof RegExp) return s;
  const m = String(s).match(/^\/([\s\S]+)\/([a-z]*)$/);
  return m ? new RegExp(m[1], m[2]) : new RegExp(s, flags);
}
export const compileRules = (list) => list.map(([re, ...rest]) => [rx(re), ...rest]);
export const compileSpec = (spec) => ({ base: spec.base, rules: compileRules(spec.rules || []) });
