# Harvest protocol

The Ad Library has **no usable public API for commercial ads** (the official
Graph API covers political/issue ads only). Plain `curl` gets a JS bot
challenge, and the old `/ads/library/async/search_ads/` endpoint was retired.

The working method: let a real browser load the page and make one real search
request with its own valid tokens, capture that request's shape, then replay
it — from inside the *same browser page* — with our own variables. This is
stable because nothing is forged; the page hands us its own credentials.

`tools/harvest.mjs` does all of this end to end with
[Playwright](https://playwright.dev), so there is no manual copy-pasting into
a browser console.

## What `harvest.mjs` does

```bash
node tools/harvest.mjs --niche <niche> --date <YYYY-MM-DD> [--headed]
```

1. Launches Chromium in a **brand-new, disposable profile** (`playwright`'s
   default — no saved cookies, no saved logins, nothing carried over between
   runs). This is what makes "logged-out only" automatic instead of something
   you have to remember.
2. Navigates to the Ad Library with the niche's first seed keyword.
3. Confirms the session is anonymous (`document.cookie` has no `c_user`, and a
   **"Log in"** button is visible) — aborts the whole run if not.
4. Injects the harvester logic (`window.__AL`, defined inline in
   `harvest.mjs`) into the page and scrolls once to force a real pagination
   request, capturing its `fb_dtsg` token, `doc_id` and variable shape as a
   template.
5. Runs every keyword in `config/niches/<niche>.json` → `keywords.core` and
   `keywords.angle`, and every seed page in `seed_pages`, replaying the
   captured template with `page.evaluate()` from Node — no 45-second
   tool-call timeout to work around, since Node just `await`s it directly.
6. Writes the deduplicated result set to
   `_reports/<date>/raw/ads-01.json`.

`fb_dtsg` never leaves the browser process — it's read into a page-local JS
variable and used only for in-page `fetch()` calls; `harvest.mjs` never
returns it to Node or writes it anywhere.

## Query variables that matter

| Variable | Use |
| --- | --- |
| `queryString` | the keyword |
| `searchType` | `keyword_exact_phrase` (tight) or `keyword_unordered` (loose, noisy) |
| `viewAllPageID` | page ID — pulls **that page's whole library**, ignoring `queryString` |
| `activeStatus` | `active` \| `inactive` \| `all` |
| `first` | page size; 30 is a safe ceiling |
| `cursor` | pagination cursor from the previous response |
| `countries` | `["US"]` |
| `mediaType` | `all` \| `video` \| `image` |

**Use `keyword_exact_phrase` for the niche terms.** `keyword_unordered`
matches any word anywhere and floods the results with unrelated verticals —
e.g. a search for "debt relief" can return supplement ads.

**For per-page pulls always use `viewAllPageID`.** Keyword search only finds a
page's ads that happen to contain the keyword; `viewAllPageID` returns their
entire active library, which is what the launch and lifespan math needs.

## Coverage gap — full-library pulls are not optional for active advertisers

**A keyword-search hit is a sample of a page's library, not its library.**
Meta returns matches for the literal phrase searched; a page running 150 ads
where only 20 happen to contain your exact keyword will show up with 20 ads
from the keyword sweep and 150 from `viewAllPageID`. Undercounting an
advertiser by 5–10x can badly skew the "top N most aggressive" ranking.

`harvest.mjs` handles this automatically: after the keyword sweep it tallies
hit counts per page across the whole store and runs a full `viewAllPageID`
pull for every page above a low floor (5+ hits), not just the handful that
look biggest at a glance.

## Resolving page IDs

The niche config lists seed pages by **name**. `harvest.mjs` resolves each to
a `page_id` on first use via a keyword search on the page name, then caches it
in `_state/classification.json` so later runs skip the lookup. Page names are
not unique — the script logs the match it picked (category, like count) so you
can sanity-check it once.

## Rate limiting

See `references/browser-safety.md` for the full rules; `harvest.mjs` already
implements the sleep/cap defaults described there. If you see repeated
`Rate limit exceeded` errors, stop, wait 15–20 minutes, and re-run with
`--slow` (raises the inter-request sleep and lowers per-target caps).
