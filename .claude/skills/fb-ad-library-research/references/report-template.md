# Report template

`_reports/<run-date>/REPORT.md` is the deliverable. Everything else in the run
folder is supporting detail it links to.

Write for a buyer who has 5 minutes and wants to know what to build today.
Lead with the answer. No preamble, no methodology section at the top.

---

## Required structure

```markdown
# <Niche> — Meta Ad Library · <run date>
Prev run: <date or "baseline"> · Ads: <n> · Pages: <n> (<a> affiliate / <b> branded / <u> unclassified)

> **Coverage**: <only if partial — what failed and what it means. Omit if clean.>

## The read
<3–5 bullets. The actual conclusions. What changed, what to do.
If one thing matters most this week, it is the first bullet.>

## 1 · Top 50 — the most aggressive ads
<From `rank.mjs` / `_top/<date>-aggressive-top50/`. Ranked by aggressiveness —
the weighted pressure tactics each ad uses (price shock, hard deadline, scarcity
count 3 · objection pre-empt, loss framing 2.5 · anchor gap 2 · qualification
1.5 · reason-why 1), ties by urgency → RVERT → duplication. Geo-swapped copies
of one ad count once (show combined duplication + variant count). Needs at
least one real pressure tactic (≥1.5): if fewer than 50 qualify, show that many
and say so — never pad with vanilla ads. Columns: # · aggressiveness · tactics ·
alive (the creative's oldest clone) · dup · bracket · page · copy hook · landing
path · Ad Library link. Then the copy-hook vs spoken-hook comparison.>

## Emotional triggers driving form fills
| Trigger | Affiliate share | WoW | Branded share | WoW | Best example |
<Ranked by affiliate share. Example cell links to the ad.>

## Angles
### Most common
| Angle | Affiliate | Branded | WoW share | Verdict |
### Trending
<rising / falling, share points, paired with the lifespan read>
### Net-new this week
<Urgent / Watch / Noise, per analysis-framework. If none: say "none" —
do not pad this section.>

## Best performing hooks
### Aggressive affiliate
| # | Hook (verbatim) | Page | Alive | Coll. | Angle | Link |
### Branded
| # | Hook (verbatim) | Page | Alive | Coll. | Angle | Link |
<Top 10 each. hook_score order. Verbatim, always.>

## Ad activity over time
### Launches by page
| Page | Bucket | Active | WoW | New | Re-used | New creatives | Reuse ratio | Mode |
### Creative life span — affiliate
| Period | # Ads | WoW | New Ads | WoW | Strength (30D) | WoW |
### Creative life span — branded
<same shape>
### Movers
<Pages with material change + the one-line inference.>

## New creatives this week
<From `creatives-new.json` — creatives never seen in any prior run, deduped.
This is what competitors actually MADE this week, stripped of re-runs and
geo-swaps. A page with many launches but zero new creatives is scaling; one
with many new creatives is testing. If none: say "none" — that is a finding.>

## Landing pages
| Page | Domain | Path shape | Funnel type | First seen |
<Full list in landing-pages.md; here show only new-this-week and changed.>

## Needs a call
<Unclassified pages, best guess + reason. your answer becomes permanent.>

## Handoff
**Remix now** — <named ads + links + why>
**Test these hooks** — <verbatim lines + angle>
**Watch** — <re-check next week>

## Downloads
<Pointer to download-queue.md and the explicit ask.>
```

---

## Rules

- **Every number in a table that has a prior run gets a WoW cell.** Baseline
  run renders `--` everywhere and says so in the header.
- **Every hook and example links to its Ad Library URL.** No exceptions.
- **Never blend brackets in a ranking.** Separate tables, always.
- **"None" is a valid finding.** An empty net-new section is information. Pad
  it and the report becomes untrustworthy.
- Keep `REPORT.md` under ~400 lines. Depth goes in `angles.md`, `hooks.md`,
  `activity.md`, `landing-pages.md`.
- Lifespan tables use the exact bucket labels from `activity-metrics.md` so
  they line up with your existing dashboard.
- **Video hooks and copy hooks get separate sections, never one ranking.**
  Copy hook = first line of body text. Video hook = what is heard in the first
  seconds plus what is on screen in the first 3s.
- Report `newly_downloaded` vs `carried_over` from the media pass, so it is
  obvious how much of the week is genuinely new work.

## The PDF

`tools/pdf.mjs` is the last step of every run. It reuses **"## The read"**
(numbered list, each item starting with a bold title) and **"## Handoff"** from
this file verbatim, so keep those section names. Everything else in the PDF is
built from the run's data. Standard markdown only — lists, `###` headings,
bold/italic, links, `code`, simple tables.
