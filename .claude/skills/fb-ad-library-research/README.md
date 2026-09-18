# FB Ad Library Research

A self-contained Claude Code skill: point it at a lead-gen niche (starter
config: **loan / personal loans / debt consolidation**), it scans the public,
logged-out Meta Ad Library for competitor ads, and hands back a weekly
competitive-intelligence PDF — trending angles, best hooks, which creatives
are being scaled vs. killed, split into "aggressive affiliate" vs "branded"
competitors so you're never comparing apples to oranges.

Start here: **`SETUP.md`** (one-time), then **`RUNBOOK.md`** (weekly).

## How it fits together

```
tools/harvest.mjs      Playwright browser -> scrapes the public Ad Library
        │               (never logs in, never touches a real FB session)
        ▼
raw/ads-01.json         every ad, distilled: copy, dates, format, links
        │
tools/run.sh  ──┬── analyze.mjs      launches, lifespan, new-vs-reused, WoW deltas
                ├── angles.mjs       angle + trigger tagging
                ├── media.sh         download creatives, whisper transcribe, OCR
                ├── scripts.mjs      spoken hook + on-screen hook per creative
                ├── score.mjs        RVERT / aggressiveness scoring
                ├── rank.mjs         the one ranking everything downstream uses
                ├── redirects.mjs    where the top ads' links actually land
                └── pdf.mjs          builds the final PDF from REPORT.md + data
                ▼
        ~/Downloads/<Niche>-Ad-Library-Report-<date>.pdf
```

Everything lands under
`~/Documents/AdLibraryResearch/fb-ad-library/<niche>/`, content-addressed by
creative hash — a creative seen last week is never re-downloaded or
re-transcribed, only symlinked into this week's folder.

## What changed from the original version you were handed

The copy you got was built for one specific person's machine and team setup.
This version is the same engine, re-pointed at a generic setup and adapted so
it actually runs standalone in Claude Code:

- **The browser step is now a real script (`tools/harvest.mjs`), not a
  copy-paste-into-a-browser-console workflow.** The original relied on a
  proprietary in-app browser tool (`mcp__Claude_Browser__*`) that pastes JS
  into a live console and works around a 45-second tool-call timeout with a
  job/poll pattern. `harvest.mjs` does the exact same technique (capture the
  Ad Library's own GraphQL request template, replay it with different query
  variables) but via [Playwright](https://playwright.dev), driven straight
  from Node — no timeout workaround needed, and no manual pasting.
- **A brand-new disposable browser profile every run**, deleted when the run
  ends, instead of relying on "just remember to use the logged-out browser
  tool." There's no code path in this version that can accidentally point at
  a real, logged-in Facebook session.
- **The two integrations you didn't want (Google Sheet sync, Similarweb
  traffic) are removed**, not just disabled — `tools/sheet-sync.mjs` and
  `tools/traffic.mjs` aren't in this copy, and the PDF/report no longer
  reference a specific team's shared spreadsheet.
- **It doesn't depend on a missing parent skill.** The original said "read
  `~/.claude/skills/research/SKILL.md` first — this skill inherits [its
  rules]" but that file was never included in what you got. This version is
  fully standalone; every rule it needs is written directly into `SKILL.md`.
- **All paths, names and the hardcoded team spreadsheet reference are
  genericized** — `~/Documents/Adsora/...` → `~/Documents/AdLibraryResearch/...`,
  a specific person's name removed from every doc and log line.
- **A starter `config/niches/loan.json`** in place of the original's
  home-services/insurance-only configs. Its keyword list is a reasonable
  starting point; `seed_pages` is intentionally empty since I don't know your
  competitors — see the note at the bottom of `SETUP.md`.

## A note on what this is (and isn't) for

This only reads the **public** Ad Library — no login, no scraping of private
data, no filling out competitors' lead forms, no CAPTCHA workarounds (see
`references/browser-safety.md`; the harvester aborts itself if it ever
detects a logged-in session). It's market research: seeing what's already
running and for how long tells you what's working, the same way any
competitive swipe-file or ad-spy tool does.

The niche you named — loans / debt consolidation — is a regulated space where
some competitors run compliance-edge copy (implied lender/government
eligibility, "relief program" framing, quiz funnels). This tool's job is to
*show you that landscape*, split clearly into "aggressive affiliate" vs
"branded" so you can see which bracket a given tactic lives in and what its
risk profile is — not to tell you which one to run. The `clean-ads` add-on
(`RUNBOOK.md`) exists specifically so you also always have a compliant
reference set, not just the aggressive end, to work from.
