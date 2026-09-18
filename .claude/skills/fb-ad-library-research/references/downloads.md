# Creatives: the content-addressed store

**A creative is downloaded once, ever — and transcribed once, ever.**

Everything is keyed by `creative_hash` (copy + title + format, normalised so
geo/price swaps collapse into one creative). Files live at the niche level and
the dated page folders hold relative symlinks into them:

```
<niche>/
├── _creatives/     <hash>.mp4 | <hash>.jpg   ← the only real bytes
│   └── index.json  hash → first_seen, last_seen, runs[], ad_ids[], pages[], bytes
├── _transcripts/   <hash>.txt                ← whisper, once per creative
├── _ocr/           <hash>.txt                ← tesseract on the hook frames
├── _frames/        <hash>-t0.5.jpg …         ← 0.5s / 1.5s / 3s
└── <bucket>/<page>/<run-date>/creatives/
        <ad-id>-<hash>.mp4 -> ../../../../_creatives/<hash>.mp4
```

The dated page folder still shows every creative that page ran that week — it
just costs a symlink instead of a second copy. A second run date over the same
534 creatives costs about **1 MB instead of 850 MB**, and finishes in seconds.

## What each weekly run actually does

`tools/media.sh <niche> <date>`:

1. Migrates any legacy real files into the store (idempotent, safe to re-run).
2. Downloads **only** hashes the store has never seen.
3. Symlinks every creative this run saw into its dated page folder.
4. Transcribes and OCRs **only** creatives with no result yet.
5. Updates `_creatives/index.json` and writes `creatives-new.json` — the
   creatives that appeared for the first time this run.

It prints `newly_downloaded` / `carried_over` every time. If `carried_over` is
large and `newly_downloaded` is small, that is the system working.

## `creatives-new.json` is a finding, not bookkeeping

It is the precise answer to *"what did competitors actually make this week?"* —
stripped of every re-run and geo-swap. A page launching 40 ads that produces
**zero** entries here is scaling old winners; one producing 12 is testing.
Report it.

## Attempts are recorded, not just successes

Some ads carry **no audio stream at all** (silent text-on-screen video — 21 of
219 in the roofing baseline). Whisper writes nothing for them, so `media.sh`
creates an empty transcript to record that the attempt happened. The skip test
is `-f` (exists), never `-s` (non-empty) — otherwise every silent video gets
re-transcribed every Monday, forever.

An empty transcript therefore means *"no voiceover"*, which is a real format
finding. It never means *"not yet processed"*.

## Freshness

Ad Library media URLs are short-lived signed links. Run `media.sh` the **same
day** as the harvest. If a new creative 403s, re-harvest that single ad rather
than reporting a dead link — anything already in the store is unaffected.

## Handing to ad-maker

A stored creative is exactly what `ad-maker` wants as INTAKE: the file path
plus the angle, trigger, spoken hook and copy hook already classified. When
you picks one, offer to run it straight through.
