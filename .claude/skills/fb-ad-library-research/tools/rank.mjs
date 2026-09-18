/* Aggressiveness ranking — one definition shared by score.mjs (stores it),
 * top.mjs (folders), redirects.mjs (which links to trace), pdf.mjs and the report.
 *
 * aggressiveness = sum of the weights of the pressure tactics ("aggression
 * devices") an ad uses. Weights reflect how hard each one pushes a cold viewer
 * to act now, against their own skepticism:
 *
 *   3    price shock · hard deadline · specific scarcity count
 *   2.5  objection pre-empt · loss framing on the deadline
 *   2    anchor gap named
 *   1.5  qualification as exclusion
 *   1    reason-why mechanism
 *
 * Ties (common — most ads use one tactic) break by urgency U, then RVERT, then
 * duplication, then lifespan. Only ads with at least one real pressure tactic
 * (aggressiveness >= 1.5) are ranked; if a niche has fewer than TOP_N, show what
 * exists — never pad with vanilla ads.
 * A niche config can override weights with `analysis.aggression_weights`;
 * unknown tactic labels (from niche-specific rules) weigh 1.5.
 */
export const AGGRESSIVE_TOP_N = 50;
/* A reason-why alone (weight 1) is a believability device, not pressure — it pulled a
   lumber supplier and a marketing agency into the roofing list. Need >= one real tactic. */
export const MIN_AGGRESSIVENESS = 1.5;
export const lifeOf = x => x.family_life ?? x.life ?? 0;   // oldest clone = how long the creative has run
export const DEVICE_WEIGHTS = {
  'price shock': 3, 'hard deadline': 3, 'specific scarcity count': 3,
  'objection pre-empt': 2.5, 'loss framing on the deadline': 2.5,
  'anchor gap named': 2, 'qualification as exclusion': 1.5, 'reason-why mechanism': 1,
};
export function aggressivenessScore(devices = [], weights = {}) {
  const w = { ...DEVICE_WEIGHTS, ...weights };
  return Math.round([...new Set(devices)].reduce((s, d) => s + (w[d] ?? 1.5), 0) * 10) / 10;
}
/* Legend text for a report/PDF should describe what's ACTUALLY in play for
 * this niche, not always the roofing-default device list — a niche that
 * overrides `analysis.rvert.aggression` (e.g. bathroom-remodeling's scam/
 * gray-hat redefinition) uses entirely different labels. Derive the legend
 * from the labels that actually appear in the scored set, sorted by weight. */
export function activeDeviceWeights(S, extraWeights = {}) {
  const w = { ...DEVICE_WEIGHTS, ...extraWeights };
  const labels = [...new Set(S.flatMap(x => x.devices || []))];
  return labels.map(l => [l, w[l] ?? 1.5]).sort((a, b) => b[1] - a[1]);
}
export function byAggressiveness(a, b) {
  return (b.aggressiveness ?? aggressivenessScore(b.devices)) - (a.aggressiveness ?? aggressivenessScore(a.devices))
    || (b.urgency || 1) - (a.urgency || 1) || (b.score || 0) - (a.score || 0)
    || (b.family_coll || 1) - (a.family_coll || 1) || lifeOf(b) - lifeOf(a);
}
/* One ad swapped across counties/states/cities ("150 homeowners in OAKLAND COUNTY",
   "...in MACOMB COUNTY") is one idea, not eight — keep its best-ranked copy and
   carry the variant count, so a single template can't fill the list. This has to
   catch it even when the swap ALSO changes the page name (a "Window Renewal
   Program" running under one front per state is one network, not N competitors —
   same pattern as the bathroom-remodeling county-swap and Yankee Home Improvement
   findings), so the key deliberately excludes pid. Exact-string matching after geo
   normalization still missed near-duplicates that reword slightly beyond the
   geo/number swap, so this collapses on word-set similarity, not exact equality —
   a single swapped city/county token should not sink the match, which is why
   this compares bags of words rather than n-gram shingles (a single differing
   word poisons every shingle it falls in, understating similarity on the short
   ~90-char hooks this runs on). */
const STATES = /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/g;
export function normHook(x) {
  return String(x.copy_hook || x.body || '').toLowerCase()
    .replace(/\b[a-z]+(\s[a-z]+)?\s+county\b/g, '<geo>').replace(STATES, '<geo>')
    .replace(/\d[\d,.]*/g, '#').replace(/[^a-z#<> ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
}
// kept for any external caller that wants the old page-scoped exact key
export function geoKey(x) { return `${x.pid}|${normHook(x)}`; }
function wordSet(str) { return new Set(str.split(' ').filter(Boolean)); }
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0; for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}
// Tuned so one swapped city/county token (out of a ~10-15 word hook) still
// collapses, while two independently-written ads sharing only common CTA
// boilerplate stay apart. Require a few words of real signal before comparing.
export const NEAR_DUP_THRESHOLD = 0.72;
export const NEAR_DUP_MIN_WORDS = 4;
function collapseGeoVariants(sorted) {
  const kept = [];
  for (const x of sorted) {
    const sh = wordSet(normHook(x));
    const match = sh.size >= NEAR_DUP_MIN_WORDS ? kept.find(k => jaccard(sh, k._sh) >= NEAR_DUP_THRESHOLD) : null;
    if (!match) {
      kept.push({ ...x, _sh: sh, geo_variants: 1, variant_ids: [x.id],
                  variants_dup_total: x.family_coll || 1, variant_pages: new Set([x.page]) });
    } else {
      match.geo_variants++; match.variant_ids.push(x.id);
      match.variants_dup_total += (x.family_coll || 1); match.variant_pages.add(x.page);
    }
  }
  return kept.map(({ _sh, variant_pages, ...rest }) => ({ ...rest, variant_pages: [...variant_pages] }));
}
export function rankByAggressiveness(S, n = AGGRESSIVE_TOP_N) {
  const sorted = S.filter(x => (x.aggression || 0) > 0 && (x.aggressiveness ?? aggressivenessScore(x.devices)) >= MIN_AGGRESSIVENESS)
    .slice().sort(byAggressiveness);
  return collapseGeoVariants(sorted).slice(0, n);
}
/* Companion cut: raw top-N by RVERT alone, no aggressiveness or evidence
 * filter — a high-RVERT ad can use zero pressure tactics, and vice versa.
 * Same geo-dedup as the aggressiveness cut, so the two top-N lists are
 * apples-to-apples and neither is padded with clones of one template. */
export function rankByRvert(S, n = AGGRESSIVE_TOP_N) {
  const sorted = S.slice().sort((a, b) => b.score - a.score);
  return collapseGeoVariants(sorted).sort((a, b) => b.score - a.score).slice(0, n);
}
