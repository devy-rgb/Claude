# Format Module — Notification / Popup

The ad *is* the notification. A floating card — styled as either a mobile push
notification or a centered app modal — appears on a solid or blurred background,
delivers the hook line as the card copy, and puts the CTA on the button. No
face, no voice, no b-roll. The format mimics the UI patterns the viewer taps
all day and exploits the same compliance reflex: a card with a button gets
pressed.

Two variants, pick one per execution:

| Variant | Looks like | Best for |
|---------|-----------|---------|
| **Push notification** | Slide-in card from top of screen, rounded corners, notification badge (red circle + icon), title + 1–2 lines of body, CTA button | Urgency / reminder / "your zip code qualifies" hooks |
| **Modal popup** | Centred card over a dimmed background, icon/shield at top, larger heading, body paragraph, primary CTA button + "Cancel" dismiss link | Congratulations / eligibility reveal / "you've been selected" wins |

**Engine stack:** no generative video model required.
- **Image ad:** `tools/assemble.mjs` renders the card as a PNG using the `notification`
  layer type (see §Assembly below), or export as HTML → screenshot.
- **Video ad:** `tools/assemble.mjs` animates the card over a background clip
  — slide-in + bounce settle for push, scale-up fade-in for modal — with a
  notification ping sound and optional hand-tap beat at the CTA.

This is a **text-first format** (like wall-of-text and moving-bg-vo-text).
No model prompts, no character anchor, no clip generation unless a background
video is needed.

---

## OS-accurate presets — `tools/notification-mockup.mjs`

A third variant beyond the two generic cards above: a mockup styled to look like
the actual OS chrome (iPhone lock-screen banner, Android heads-up notification,
old-Windows XP-style balloon toast over a taskbar), not a generic app card. Built
and locked in with Austin on 2026-09-14 (bathroom-remodel notification run).

```js
import { iphoneNotification, androidNotification, winxpNotification } from "./tools/notification-mockup.mjs";
const html = iphoneNotification({ title: "Congratulations!", body: "...", cta: "Claim Now" });
```

Or drive it straight from a spec file: `node tools/notification-mockup.mjs spec.json`
with `{ outDir, scale, items: [{ name, os: "iphone"|"android"|"winxp", ...fields, bg }] }`
— it builds the HTML and shells out to `card.mjs` itself.

**House defaults for this preset (do not regress below these without asking):**
- **Plain solid black or white background** (`bg: "black" | "white"`, default
  `"black"`) — no simulated wallpaper, no blurred photo, no desktop art behind
  the card. The card is the only thing competing for attention.
- **The notification card is vertically centered in the frame** (flex-centered),
  not pinned to a "realistic" lock-screen/tray position. Deliberately less
  OS-accurate in exchange for reading clearly at a glance — this is an ad, not
  a screenshot. The old-Windows balloon centers in the space above the taskbar;
  the taskbar itself stays pinned to the bottom edge so the OS is still
  identifiable.
- **Every text element is >=16px, and body copy defaults to 36-45px, headings
  45px+** (bumped 50% on 2026-09-14 on top of the earlier senior-readability
  pass — check the live file for current numbers before assuming these) —
  audience is explicitly senior-friendly mobile readers, not just the legal
  16px floor. High contrast only (white/near-white on black, near-black on
  white) — never gray-on-gray for anything a reader must read to act.
- **The frame grows to fit long copy; it never shrinks type to fit a box.** The
  outer frame is a flex COLUMN (`min-height`, not a fixed `height`) and every
  builder stacks its pieces as real flex children (status bar, then a
  `flex:1` centering wrapper around the card, etc) — never `position:absolute`
  for the main stack. Absolutely-positioned children do not contribute to a
  parent's auto height, which silently caps the frame at the nominal size and
  either clips or (if you'd added shrink logic) forces smaller type; the
  flex-column structure is what makes "grows instead of shrinking" actually
  true rather than just a comment. Verified 2026-09-14 by rendering the iPhone
  preset with 6x the normal body length: card grew to 14 wrapped lines, font
  stayed at 30px, nothing clipped. If a body is ever long enough to need more
  than `SAFE_MAX_H`'s headroom, raise `maxHeight` on that item — do not add
  auto-shrink.
- Each builder takes `offsetY` (px, default 0) so a slide-in/bounce/slide-out
  video can be built as a plain frame sequence: render the same card at a
  negative `offsetY` (off-frame) easing to `0` (rest), hold, then ease back out
  — concat the PNGs with ffmpeg (`concat` demuxer, per-frame `duration`) rather
  than trying to get `assemble.mjs`'s `notification` layer type to do it, which
  does not exist yet (see note below). Because every frame uses the same body
  text, all frames render at identical dimensions — required for the concat +
  scale step below to not distort the image; if you vary text length across
  frames of the same video, check dimensions match before scaling.

**Reality check on the "Engine stack" note above:** as of 2026-09-14,
`tools/assemble.mjs` does **not** actually implement a `notification` layer
type — that line describes the intended interface, not a shipped one. Until it
does, build OS-preset stills with `notification-mockup.mjs` + `card.mjs`
directly, and build the animated version by rendering a frame sequence (vary
`offsetY` per frame) and assembling it with plain `ffmpeg` (concat demuxer +
a synthesized two-tone ping via `sine=` lavfi, muxed in with `adelay` — pad
with `apad`, never `-shortest`, or the short audio clip truncates the whole
video). A worked example lives in `ad-remix-runs/2026-09-14-notification-bathroom/`
in the Adsora project (`generate-cards.mjs`, `frames/concat_list.txt`).

---

## When this format fits the DNA

- **"Your zip qualifies" / eligibility reveal** — the card IS the program
  telling the homeowner they're in. Most natural UI for that moment.
- **Reminder / deadline urgency** — "Reminder: your zip code closes this week"
  reads as a calendar alert, not an ad.
- **Congratulations / win framing** — modal popup with "Congratulations! You
  qualify for no-cost window replacement" mirrors every app win the viewer has
  seen. The shield or checkmark icon sells legitimacy before they read a word.
- **Retargeting** — viewer saw the offer, didn't click. A notification that
  names the specific offer (windows, roof, bath) is the highest-specificity
  retargeting creative and the cheapest to produce.
- **Split-test hook variants** — ten card headlines render in under a minute
  with zero model spend. Right format to test five angles before committing
  to a face UGC.
- **Opening hook frame for any other format** — a 2–3s notification slide-in
  can open a UGC yapper or in-car ad before cutting to the face. Stage 4
  should suggest this combo when the script's hook is an eligibility reveal.

Skip it when the DNA requires showing the product in use, a demonstration, or
a human delivery with emotional weight. The card has no voice; if the persuasion
lives in the spoken word, use a different format and use this as the hook frame
only.

---

## Card anatomy

### Push notification variant (reference: "Reminder" card)

```
┌──────────────────────────────┐ ← rounded corners, r=16px
│  [ICON]  TITLE               │●← red badge, 20px, top-right corner
│          Body line 1         │
│          Body line 2         │
│  ─────────────────────────── │
│       [ CTA BUTTON ]         │
└──────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Card bg | White `#FFFFFF`, shadow `0 8px 32px rgba(0,0,0,0.18)` |
| Card width | 78% of frame width |
| Rounded corners | 16px radius |
| Notification badge | Red circle `#CC0000`, white `!` or bell icon, 22px, top-right |
| Title | Dark red `#8B0000` or `#CC0000`, bold, 18–20px, center-aligned |
| Body | Dark charcoal `#222222`, regular, 14–16px, center-aligned, max 2 lines |
| Divider | 1px `#E0E0E0` hairline between body and button |
| CTA button | Text only — bold caps, dark red `#CC0000`, 16px, no button bg (link style) |
| Background | Solid mid-grey `#6B6B6B` or a blurred/dimmed version of the offer's b-roll |

### Modal popup variant (reference: "Congratulations" card)

```
        ┌──────────────────┐
        │    [🔒 icon]     │← shield or check, blue `#4A90D9`, 40px
        │  Congratulations!│← bold heading, dark navy `#1A1A2E`
        │  Body text here  │← 2–3 lines, grey `#555555`
        │                  │
        │ [ Unlock the Deal]│← solid blue button, white text
        │     Cancel        │← plain text link, grey
        └──────────────────┘
```

| Element | Spec |
|---------|------|
| Outer background | Dark navy `#0D1B2A` or deep charcoal, full-bleed |
| Card bg | White `#FFFFFF`, shadow `0 12px 40px rgba(0,0,0,0.35)` |
| Card width | 82% of frame width |
| Icon | Shield `🛡` or checkmark `✓` or lock `🔒`, blue `#4A90D9`, 40px, centered |
| Heading | Bold, dark navy `#1A1A2E`, 22–24px, center-aligned |
| Body | Regular, medium grey `#555555`, 14–16px, center-aligned, max 3 lines |
| Primary button | Solid blue `#4A90D9` bg, white text, bold, 16px, 8px radius, full-width |
| Dismiss link | Plain text "Cancel", grey `#888888`, 14px, centered below button |

---

## Copy rules

The card has three text slots. Fill them and nothing else.

| Slot | Max length | What goes here |
|------|-----------|----------------|
| **Title / Heading** | 4–6 words | The hook rewritten as a subject line. "Your Zip Code Qualifies." / "Free Window Replacement Alert." |
| **Body** | 15–25 words | The offer + qualifier in one breath. "Homeowners in your area can get full window replacement at no cost through the 2026 program." |
| **CTA button** | 3–5 words | The action, not the offer. "Check Your Eligibility" / "Unlock The Deal" / "See If You Qualify" |

No exclamation marks in the title of push variant — it reads as spam. Save them
for the modal heading. Never use "FREE" in all caps in the card copy — ad
review flag.

---

## Video animation (assemble.mjs)

### Push notification — slide-in

```json
{
  "format": "notification-push",
  "background": { "type": "color", "value": "#6B6B6B" },
  "notification": {
    "variant": "push",
    "entry": "slide-down",
    "hold_s": 3.5,
    "bounce": true,
    "exit": "slide-up",
    "sound": "ping"
  },
  "music": false,
  "duration_s": 6
}
```

- **Entry:** card slides from above the top edge, decelerates with a 60ms
  bounce settle at rest position (y = 15% from top, centered x).
- **Hold:** 3–4s — long enough to read the body, not so long it loops awkwardly.
- **Exit (video only):** slides back up and off — clean, not a fade.
- **Sound:** a single notification ping at entry (no voice, no music unless
  the brief calls for a subtle music bed at -18dB).
- **Hand tap beat (optional):** at 0.5s before exit, a phone hand slides in
  from the bottom and taps the CTA button area once. Add with `tap_beat: true`.

### Modal popup — scale-in

```json
{
  "format": "notification-modal",
  "background": { "type": "color", "value": "#0D1B2A" },
  "notification": {
    "variant": "modal",
    "entry": "scale-up",
    "hold_s": 4,
    "exit": "fade-out",
    "sound": "chime"
  },
  "music": false,
  "duration_s": 7
}
```

- **Entry:** card scales from 0.6 → 1.0, ease-out, 250ms. Background dims
  simultaneously from 0 → 0.7 opacity.
- **Hold:** 4s.
- **Exit:** card fades to 0 with the background. No slide.
- **Sound:** a soft two-tone chime (success/win register) at entry.

---

## Image ad (static)

Stage 4 outputs a **card spec** — all text slots filled, colors locked, variant
named — and calls `tools/assemble.mjs --static` to render a PNG at 1080×1920
(vertical) or 1080×1080 (square). The card is centered in the frame. Background
is the solid color or a single b-roll frame (blurred, `blur: 18px`, dimmed
`dim: 0.55`).

No model generation required. Deliver the PNG directly as the image ad asset.

---

## Combo use: notification hook + face UGC body

When the script's opening line is an eligibility reveal or a "your zip
qualifies" moment, Stage 4 should offer this combo:

1. **0–3s:** push notification slides in, ping sound, holds.
2. **3s:** hard cut to face UGC (in-car, yapper, or desk authority) picking
   up from the second beat of the script.

The notification does the scroll-stop; the face does the persuasion. Instruct
`assemble.mjs` to prepend the notification clip to the UGC chain as clip 0.

---

## Assembly notes

- `disclosure: false` — hard rule 14, no disclaimer.
- No captions on the card itself — the card IS the text.
- If the video continues after the card (combo use), standard karaoke captions
  resume on the face section.
- End card: not needed for a standalone 6–7s notification video — the card
  is the end card. For combo use, standard end card on the face section.
- Aspect ratio: **9:16 vertical** for all placements. The card at 78–82%
  width fills the thumb-stop zone without feeling crowded.

---

## Routing and cost

Local render only — no model API calls for standalone notification ads. A batch
of 10 image variants renders in under 60 seconds. A 6s animated video (card
only) renders in under 2 minutes. The combo (notification + face UGC) costs
whatever the face UGC clips cost; the notification prepend is free.
