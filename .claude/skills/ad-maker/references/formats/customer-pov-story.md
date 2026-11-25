# Format Module — Voiceover + Customer POV Story

A first-person confessional voiceover — the customer narrating their own story
in their own head, past tense, "I used to… then I found…" — plays under bespoke
first-person POV footage of them living that story: hands on a cart, reaching
for a shelf, scrolling a phone, looking at a receipt. No face ever appears. It
reads as a real person's memory of a specific moment, not a testimonial to
camera and not generic stock — the closest AI-ad analogue to a TikTok "story
time" or shop-with-me post.

**Engine stack:** hybrid of `faceless-vo-broll` (voice + assembly) and
`pov-first-person` (POV camera discipline) — see §1. Read
`references/faceless-video.md`, `references/house-playbook.md`, and
`references/formats/pov-first-person.md` first.

---

## When this format fits the DNA

A personal-story / testimonial DNA where the winning element is the **narrative
arc**, not a face or a spokesperson's authority — "I used to X, then Y happened,
now Z" — and the competitor ad's proof lives in specific, relatable physical
beats (a receipt total, a cart, a phone screen) rather than credentials. If the
winning element IS a face — someone's genuine reaction, a recognizable
testimonial — that's `talking-head` or `ugc-yapper`, not this. If the ad has no
narrative arc at all (a pure list/explainer), that's plain `faceless-vo-broll`.

---

## §1. Why this is a hybrid, not plain faceless-vo-broll

Plain `faceless-vo-broll` pulls generic screened stock — it doesn't matter which
specific clip illustrates "the mechanism" as long as it's on-topic. A customer
POV story needs the picture to hit **specific narrative beats in order** (the
moment of sticker shock, the moment she finds the fix, the moment the total
comes back lower) that a stock folder will not reliably contain. So this format
**generates its own first-person b-roll** the way a scene format generates
clips, then hands the finished silent footage to `tools/faceless.mjs` for the
same VO + caption + music assembly plain faceless ads use.

Two deliverables, not one:
1. A **short POV clip sequence** (Stage 4 prompts, generated like any scene
   format — stills → silent video clips, no dialogue, no face).
2. A **voiceover script + jobs file** exactly like `faceless-vo-broll.md` §"What
   Stage 4 produces" items 1 and 3, except `brollDir`/`brollPool` point at this
   run's generated POV clips instead of (or blended with) the stock library.

---

## §2. Production rules — the POV b-roll clips

1. **Camera IS the customer's own eyes and hands** — identical discipline to
   `pov-first-person.md` rule 1: static-equivalent viewpoint low/at natural
   height, only the micro-movement of a real person's own gaze and hand
   movements, never a cinematic dolly/pan/zoom.
2. **No face, ever, on screen.** Not even from behind, not in a mirror or
   reflective surface. If a hand needs an identity anchor (a ring, a manicure,
   a sleeve), lock it the same way a face would be — one reference still,
   restated every later clip: `HAND LOCK: same [skin tone, nail
   colour/length, any rings, cuff/sleeve] as the reference. Do not change.`
3. **Mute native audio on every clip.** These are silent b-roll plates —
   `references/house-playbook.md` §6's SILENCE LOCK applies even though there's
   no face: state plainly "generate with no native dialogue or voice audio,
   ambient sound only" so the model doesn't invent a stray voice to mute later.
4. **Product** originates from a natural POV reach — a shelf, a cart, a bag,
   a countertop — never floating into frame. Same off-frame-surface rule as
   `pov-first-person.md` rule 9.
5. **If the story moves through more than one location/leg** (walking down an
   aisle, from shelf to register), apply **ROUTE LOCK**
   (`references/formats/walk-and-talk.md` §1) so the space doesn't drift
   between clips — build the waypoint list first, one duplicate still per
   waypoint, restate the route block in every clip. A single-location story
   (all beats happen at one counter, one desk) can skip this and use a single
   locked environment reference instead, exactly like `pov-first-person`'s
   non-entrance clips.
6. **One beat per clip**, same discipline as every other format — the sticker-
   shock beat, the discovery beat, and the payoff beat are three separate
   clips, not one clip trying to hold all three.
7. **Clip length:** 2.5–5s each — these are cutaway plates, not performance
   takes; the VO carries pacing, not the picture.
8. **Generate MORE beats than the script strictly needs** (a "hook" reach, two
   or three "problem" beats, the discovery beat, two "payoff" beats) — exactly
   the faceless format's own logic (`faceless-vo-broll.md` §"the b-roll brief":
   12–20 usable clips minimum) — because the render packs picture to the VO's
   length, not the other way round, and a thin pack reads as repetitive.

## §3. Production rules — the voiceover and assembly

Identical to `faceless-vo-broll.md` §"What Stage 4 produces" item 1 and
§"Production rules", with one addition:

- **Write in first person, past tense, confessional.** "I used to just grab
  whatever was on the shelf and hope the total wasn't too bad." Contractions,
  short sentences, one idea per sentence, numbers spelled as words, no accent
  or delivery directions in the text (`faceless-vo-broll.md` §1).
- **The arc has three movements**: the old way (the problem, lived-in and
  specific, not abstract) → the turn (how she found the fix — brief, not a
  product-spec dump) → the new way (the payoff, equally specific — a real
  number, a real feeling). Map each movement to the beats generated in §2.
- **Voice**: a Kokoro preset by default, or a clone via `refAudio` if the run
  supplies one — never an accent prompted into the b-roll clips (there's no
  face to carry it); the accent lives in the voice engine choice only.
- **Jobs file**: same shape as `faceless-vo-broll.md` §"The jobs file", with
  `brollDir` pointed at this run's `05-assets/customer-pov-story/broll/`
  (the generated clips from §2) and `brollPool` built from screening that
  folder with `tools/broll-pool.mjs` exactly like stock footage — generated
  clips still get screened (drop anything with an unwanted flash of on-screen
  text or a stray reflection).

## Negative constraints

Clips (pool — 4–8 targeted per clip, on top of `pov-first-person.md`'s pool):
```
no face visible at any point, no reflection revealing a face, no mirror shows a
face, generate with no native dialogue or voice audio, hand/skin tone and any
rings or nail colour stay consistent with the reference, no product floating
into frame, no reaching motion that looks like it comes from off-body space, no
on-screen text, no captions, no logos, no watermarks, no beauty filter, no HDR,
no cinematic colour grade, camera does not pan/dolly/zoom beyond natural gaze
micro-movement, no flicker, no jitter
```

Script and folder (same as `faceless-vo-broll.md` §"Negative constraints"):
no brand names or trademarked products in generated or stock clips mixed into
the pack; no claim in the script not substantiated in `03-rebuild.md`; no
unlicensed music.

---

## Worked example — grocery shopping customer story

The reference build for this format. A woman narrates giving up on guessing at
the grocery store; the picture is her own POV moving through the trip.

**Route** (ROUTE LOCK, §2 rule 5 — this story crosses the whole store, so the
full walk-and-talk waypoint discipline applies):
1. Cart pickup at the entrance — corral of carts, entrance doors behind.
2. Produce aisle — reaching for an item, price sign visible but not readable
   text (no on-screen text rule).
3. The "problem" aisle — a shelf of look-alike products, hand hovering,
   uncertain — this is the confessional's "I used to just grab whatever" beat.
4. Discovery beat — hand pulls a phone from a pocket/bag, screen angled away
   from camera (never legible — that's a captioned graphic in post if needed),
   scrolling.
5. Refilled cart, more decisive reaching — the "new way" beat.
6. Checkout — hand places items on the belt; a receipt printing or a card tap,
   never a legible total (composite a number graphic in the assembly pass if
   the script needs one on screen).
7. Payoff — cart being loaded into a trunk, or walking to the car, bags in
   hand (hand/arm only, never a face).

**Voiceover arc:**
- Old way: "I used to just grab whatever was on the shelf and hope the total
  wasn't too bad when I got to the register."
- Turn: "Then a friend showed me the thing she'd been using for months and I
  felt kind of dumb for not knowing about it sooner."
- New way: "Now I actually know what I'm spending before I even get in line,
  and last week's trip came in almost forty dollars under what I used to pay
  for the exact same cart."

**Assembly**: seven generated POV clips (route above) screened into a pool,
`tools/faceless.mjs` packs them to the VO length, captions burned in the house
spec, a light retail ambience bed under the voice (cart wheels, distant PA,
no lyrics — cleared instrumental only). No face, no dialogue clips, no talking-
head engine involved anywhere in this format.

## Assembly note (general)

Generate: environment establishing plate (if multi-location) → waypoint/beat
stills in story order → silent POV clips in the same order → screen into
`broll-pool.json` → write the VO script and jobs file → render with
`tools/faceless.mjs` exactly as `faceless-vo-broll.md` describes. Composite any
on-screen number/graphic (a receipt total, an app screen) in the assembly pass,
never generated natively in the clip.
