# Ad activity over time

Two metrics, per page, per run, always with a week-over-week delta.

## 1. Ad launches — new vs re-used

For each page this run:

| Field | Definition |
| --- | --- |
| `total_active` | active ads in their library right now |
| `new_ads` | ads whose `ad_archive_id` is not in `_state/seen-ads.json` |
| `reused_ads` | `total_active - new_ads` |
| `creatives_distinct` | distinct `creative_hash` values |
| `new_creatives` | creative hashes never seen in any prior run |
| `relaunched` | **new ad ID carrying an already-seen creative hash** |

`relaunched` is the one people miss and it matters most. A page launching 40 new
ad IDs that are all the same 3 creatives is **scaling proven winners into more
geos/audiences**. A page launching 40 new ad IDs with 40 new creatives is
**testing** and hasn't found its winner. Same launch count, opposite meaning —
never report `new_ads` without splitting it this way.

```
creative_reuse_ratio = new_ads / max(new_creatives, 1)
```

- `> 5` → scaling mode. Find what they're scaling; that's your swipe target.
- `~1` → testing mode. Watch them, don't copy them yet.

**First run caveat:** on a baseline run every ad is "new" because
`seen-ads.json` is empty. Do not report a 100% new rate as a finding. Say
baseline, and let launch tracking begin next week.

## 2. Creative life span

Bucket every ad by days alive. Match your existing dashboard exactly:

```
0-3d, 3-7d, 7-14d, 14-30d, 30-60d, 60-90d, 90d+
```

Boundaries are `[lower, upper)` — an ad alive exactly 7.0 days is `7-14d`.

```
lifespan_days = ((is_active ? now : end_date) - start_date) / 86400
```

Per bucket report:

| Column | Meaning |
| --- | --- |
| `# Ads` | ads whose lifespan falls in this bucket |
| `New Ads` | of those, ones first seen this run |
| `Strength (30D)` | sum of `collation_count` for ads in this bucket |

`Strength` is the duplication-weighted mass in a bucket. A bucket with 89 ads
but 2,400 strength means a handful of creatives are duplicated hard — that's
where the money is.

Every column carries a WoW delta. Delta math and edge cases live in the layer's
`references/operating-doctrine.md`.

### Reading the shape

- **Fat 0-3d, thin 30d+** → churn factory. Testing hard, nothing sticking. Their
  hooks are not yet validated; don't swipe from here.
- **Fat 30-60d and 90d+** → they found it. Everything in those buckets is a
  proven winner. **Swipe here.**
- **0-3d spiking WoW while 30d+ holds** → new test wave on top of a stable base.
  The healthiest pattern, and the one to imitate.
- **30-60d collapsing** → their winner just died. Fatigue, ban, or offer change.
  Check whether the landing page changed.
- **Everything in one bucket** → they launched their whole library at once,
  usually a brand-new account or a rebuild after a ban.

### Account-level rollup

Also compute the buckets across the whole bracket (all affiliate pages
combined, all branded combined). The bracket-level shape is what tells you
whether the *category* is heating up or cooling, independent of any one page.

## 3. Per-page narrative

Numbers without a read are noise. For each page with a material change
(>25% swing in launches, or a bucket shift >10pp), write one or two sentences:
what changed, and the most likely reason. Label it as inference.

> *Find My Roofing Pro: launches up 78% WoW (30 → 107), but new creatives only
> 6 — they're duplicating the "storm relief" creative across new geos. Their
> 30-60d bucket held flat, so this is scaling on top of a working base, not a
> pivot. (inference)*
