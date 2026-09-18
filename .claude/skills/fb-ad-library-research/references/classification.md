# Classification: aggressive affiliate vs branded

Two brackets, and a holding pen. Every page lands in exactly one.

## AGGRESSIVE AFFILIATE

Selling the *click*, not the roof. They're paid per lead and route it to a
contractor network, so their incentive is volume and their copy runs as close
to the policy line as it can.

Signals (any 2 → affiliate):

- **Persona page name** — a plausible human name with no business attached:
  *Evelyn Davis*, *Clara Whitmore*, *Carson Likely*, *Jim the Home Expert*.
- **Generic aggregator name** — *Find My Roofing Pro*, *Request Home Pros*,
  *US Home-Improvements*, *Smart Lifestyle Trends*, *UpgradingHomes*.
- **Program / relief / eligibility framing** — "roof replacement relief
  program", "see if you qualify", "homeowners in <STATE> may be eligible".
  Implied government or utility backing with no named agency.
- **Quiz or multi-step funnel** — landing path contains `/quiz`, `/survey`,
  `/qualify`, `/check`, `/lp/`, `/s/`, or a step counter.
- **Aggregator / tracker domain** — domain doesn't match the page name; or
  tracking params like `sub_id`, `clickid`, `utm_source=fb&aff`, `ttclid`,
  or a known tracker host (clickflare, redtrack, voluum, everflow).
- **No local geography** — no address, no service area, or dozens of states at
  once from one page.
- **Low page likes vs high ad volume** — under ~5k likes running 50+ active ads
  is a near-certain affiliate. Real contractors can't sustain that ratio.
- **Geo-swap creative farms** — the same creative duplicated across many ad IDs
  with only a state or city name changed.
- **Listicle / advertorial bridge** — landing page is an article, not an offer.

## BRANDED

An actual company selling an actual roof.

Signals (any 2 → branded):

- Business name matches the landing domain.
- Named service area, physical address, license number.
- Manufacturer certification — GAF Master Elite, Owens Corning Preferred,
  CertainTeed.
- Financing, warranty, or crew/owner footage.
- CTA is `Get quote` / `Book now` / `Call now` into their own site.
- Page likes consistent with a local business, modest active ad count.

## UNCLASSIFIED

Anything scoring 0–1 on both, or scoring on both sides. Common genuine cases:

- A **franchise or multi-market brand** (looks aggregator-shaped, is real).
- A **contractor running affiliate-style copy** — real business, "relief
  program" framing. Note this explicitly; it's a live compliance signal about
  what Meta is currently letting through.
- A brand-new page with 1–2 ads and no pattern yet.

Do not force these. `unclassified/` exists so the two real brackets stay clean.
Surface them in the report under "Needs a call" with your best guess and the
reason, and let you decide. His answer goes into
`_state/classification.json` as a manual override and is permanent.

## Override file

```json
{
  "<page_id>": {
    "page_name": "Smart Lifestyle Trends",
    "bucket": "affiliate",
    "reason": "aggregator name + quiz funnel + 40 states, no address",
    "score": {"affiliate": 5, "branded": 0},
    "manual": false,
    "decided": "2026-09-11",
    "history": []
  }
}
```

`"manual": true` means a human decided. **Never overwrite a manual entry with a
scored one.** If a page reclassifies, push the old value onto `history` with
the date, move its folders, and call it out in the report — a page crossing
brackets is itself a finding.
