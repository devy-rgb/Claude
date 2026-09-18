# Browser safety — logged-out only

**Hard rule: this skill never touches a logged-in Facebook profile.**

If your own Facebook profile is attached to live ad accounts, automating it
and getting flagged risks those accounts too. No research finding is worth
that. The Ad Library is a fully public surface — it does not need a login,
and logging in buys us nothing.

## How `harvest.mjs` enforces this

`tools/harvest.mjs` launches Chromium in a **brand-new temp profile
(`fs.mkdtempSync`) every single run**, and deletes that profile directory when
the run finishes. There is no persistent cookie jar for it to accidentally
reuse, and no code path in this skill ever points a browser at your real
Chrome profile or a saved login.

Before the first query of every run, the script itself checks:

```js
document.cookie.includes('c_user')   // must be false
```

`c_user` is the FB user-ID cookie; its presence means a logged-in session. If
it's ever true, `harvest.mjs` aborts immediately rather than continuing. If
you're ever debugging this by hand (`--headed`, or a REPL against the same
page object), run the same check yourself before doing anything else, and also
glance at the page — a logged-out Ad Library shows a **"Log in"** button in
the top right. An avatar or profile menu instead means stop immediately.

## If Meta throws a wall

A login wall, checkpoint, "confirm you're human", or CAPTCHA means the
anonymous session got rate-flagged. Correct response:

1. **Stop the run.** Do not log in. Do not solve the CAPTCHA.
2. Whatever was harvested before the wall is already on disk in `raw/` —
   mark the run **partial** and say what was missed.
3. Next run, use `--slow` (raises the inter-request sleep, lowers the
   per-target caps) and don't run two harvests back-to-back.

An anonymous session getting throttled is a nuisance. Always take the
nuisance over trying to work around a wall.

## Keeping the anonymous session healthy

- Default sleep is 900–1500ms between requests; `--slow` raises this to
  2000–3000ms.
- Caps default to ~150/keyword and ~400/page (`config/niches/<n>.json` →
  `caps`); tighten these if you see rate-limit errors.
- **Don't run two harvest processes at once**, even for different niches —
  overlapping loops double the request rate from the same machine/IP and are
  the most likely way to trip detection.
- A rate-limit reply shows up as a GraphQL error (`err: "Rate limit
  exceeded"`, `ok: false`), not a login wall — that's a different failure
  mode with a different fix (wait, don't stop-and-report).
- If you're running a large niche, spread it across two separate runs on
  different days rather than hammering one session.
