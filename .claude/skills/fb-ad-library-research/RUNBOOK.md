# Weekly runbook

Copy-paste order for a run. Detail lives in `references/`.

```bash
cd ~/.claude/skills/fb-ad-library-research
NICHE=loan
DATE=$(date +%F)
```

**1. Harvest.**

```bash
node tools/harvest.mjs --niche $NICHE --date $DATE
```

This opens a disposable, logged-out browser, replays the Ad Library's search
API for every keyword in `config/niches/$NICHE.json`, resolves and pulls any
`seed_pages`, then does a coverage-gap full-library pull for every page that
showed up often enough in the keyword sweep. Writes
`~/Documents/AdLibraryResearch/fb-ad-library/$NICHE/_reports/$DATE/raw/ads-01.json`.
If you hit rate limits, re-run with `--slow`. Full mechanics:
`references/harvest-protocol.md`. Safety rules: `references/browser-safety.md`.

**2. Analyze (with media).**

```bash
./tools/run.sh $NICHE $DATE --media
```

`--media` downloads distinct creatives, transcribes video with local
whisper.cpp and OCRs the hook frames. Run it the SAME DAY as the harvest —
media URLs are signed and expire. Drop the flag for a copy-only pass.

Everything is **content-addressed**: a creative that ran in a previous week is
never re-downloaded and never re-transcribed, just symlinked into this week's
page folder. Watch the `newly_downloaded` / `carried_over` line — a big
carry-over with few new downloads is the system working, not a failure.

This single command chains: analyze → angles → manifest → store-alias →
scripts → calls → (media) → score → queue → writeups → hookfiles → top →
redirects → pdf.

**3. Read the copy AND the transcripts.** The scripts count; you interpret.
Work from `analysis.json`, `angles.json`, `scripts.json` and `scored.json`.
Follow `references/analysis-framework.md` and `references/scoring.md`.
Keep video hooks and copy hooks in separate sections.

**4. Write `REPORT.md`** per `references/report-template.md`. Every WoW column
filled once a baseline exists. Lead with what changed.

**5. Top folders.** `run.sh` runs `top.mjs`, which builds
`<niche>/_top/<date>-aggressive-top50/` (ranked by aggressiveness, `rank.mjs`),
`-new-launches/` and `-rvert-top20-proven/` — numbered symlinks into the store
plus a README with every Ad Library link, RVERT breakdown and full script.
Hand back the folder path, not a list of files.

**6. PDF.** `run.sh` already ends with
`node tools/pdf.mjs --niche $NICHE --date $DATE` →
`~/Downloads/<Niche>-Ad-Library-Report-<date>.pdf`.

**7. Surface.** REPORT.md, video-hooks.md, copy-hooks.md and the PDF. Standing
preference is everything downloaded and transcribed, so `--media` covers it.

---

## First run

There's no baseline yet the first time you run a niche — `run.sh` handles
this fine (WoW columns render `--` and say so), and `_state/last-run.json`
gets written at the end so the *next* run has something to diff against.

## Adding a niche

Copy `config/niches/roofing.json` (or `loan.json`) as a starting shape, swap
`keywords`, `seed_pages` and `niche_match` (include + idiom exclude), then run
the same steps with `NICHE=<new>`.

## Add-on: clean ads (no pricing, no government angle, nothing free)

Useful for pulling out the *compliant* end of a niche — a reference set of
ads that don't lean on urgency/eligibility framing at all.

Run after `run.sh --media`.
`node tools/clean-ads.mjs --niche $NICHE --date $DATE` scans copy, landing
URL, page name, voiceover and on-screen text and writes
`<run>/clean-ads/clean-ads.json`. OCR every candidate video end to end first
(a "FREE" end card hides after 3s), then read every clean/borderline row by
hand and record verdicts, angle and bracket in `<run>/clean-ads/review.json`.
Write `<run>/clean-ads/REPORT.md` ("## The read", "## Rules", "## Handoff")
and render with `node tools/clean-ads-pdf.mjs --niche $NICHE --date $DATE`
(every clean ad as a card). Add `--free-estimates ok` to let "free estimate /
quote / consultation" through (free products still fail). For the by-angle
version (top 2–3 ads per angle + analysis), tag each clean ad's `angle` in
review.json, write `## Angle: <name>` sections in REPORT.md and run
`node tools/clean-angles-pdf.mjs`.
