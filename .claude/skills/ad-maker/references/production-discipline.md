# Production Discipline — shared rules for every format

Every format module in Stage 4 enforces these. They are model-agnostic craft
distilled from the AI-video prompt skills. A format module adds its own rules on
top; it never overrides these.

**Companion:** `references/house-playbook.md` is the operator's real debugged
process and a model-failure→fix troubleshooting log. This file is the rules;
that file is what actually goes wrong and how it got fixed. Read both before
Stage 4.

---

## 0. The lock vocabulary (from the house workflows)

Every clip prompt for a live-action or animated-scene format is built from
labelled locks, each written once and pasted **verbatim** into every clip it
applies to. Drift starts around clip 3–4 the moment a lock is loosened or
reworded. Full table + wording in `references/house-playbook.md` §2:

`QUALITY / FIDELITY LOCK` · `IDENTITY LOCK` (one **per character**, never merged)
· `OUTFIT LOCK` · `ENVIRONMENT LOCK` · `PRODUCT LOCK` · `GAZE LOCK` (eyeline
direction + angle, also in negatives) · `OPENING FRAME LOCK` (clip's first frame
= the reference still exactly, no "settle-in") · `SILENCE LOCK` / `HOST SILENCE
LOCK` (placed early, repeated at every beat, plus the "override the default
audio-to-face attachment" line) · `VOICE-CONTINUITY FIREWALL` (a prior clip
loaded for voice carries *timbre only*, never dialogue content) · `COMPOSITION
LOCK` (pose + crop + framing from a style-reference photo, not its people/place).

### Static camera is the default for scene formats
The phone-UGC micro-drift default is overridden for every scene format (call-in,
broadcast, POV, hot-seat, expert-in-the-moment, Pixar street interview): **camera
completely locked off, zero movement and zero drift, tripod-still, one continuous
take, "the frame does not move"** — in the CAMERA block and again in the
negatives. Camera movement is the fastest way to break a multi-clip illusion.
The only exception is a first/last-frame interpolation clip where the *subject*
moves through a static frame.

### Duplicate stills for repeat generations
When one clip repeatedly fails content review while sibling clips with the same
characters pass, the cause is usually **extra scrutiny on repeat
video-generation requests anchored to the same reference image**. Fix: generate a
fresh, visually near-identical **duplicate still** (`Frame A′`) and anchor the
failing clip to that instead of re-using one image file. Standing practice: every
clip that reuses a pose gets its own duplicate still.

### Escalating specificity backfires
When a fix doesn't land, adding more mechanical constraints in one prompt
competes with the model's ability to deliver clean, naturally-paced dialogue
(truncated words, drawing-vs-speech lag). Revert to simpler language, state each
rule once, give more time per beat. If it's still too dense, **split the clip
into two shorter clips** — that's the next lever, not more rules. A persistent
visual artifact (a product duplicating, a door opening with no cause) usually
needs a **structural rewrite of the beat**, not more wording.

### Brand-safety classifier (Google Omni / Flow)
Distinct from violence/sexual filters. An authoritative figure endorsing a named
product + clinical/physiological mechanism language reads as undisclosed
advertising / authority impersonation / unverified health claims. Fix: plain
non-clinical wording ("helps your body wind down", not "calms your nervous
system"); remove genre-signalling words from the prompt text ("on-air", "live",
"caller") while keeping the visual concept; drop invented props not in the real
reference. Also: test one clip in isolation, try a different surface, loosen the
configurable API threshold, check for a regional block, file a false-positive
report once softened.

---

## 1. One dominant action per clip

Each clip does exactly ONE thing — one dominant physical action, expressed as a
single verb phrase. If you write "she pours the packet **and** stirs the glass",
that is two clips. Two actions in one prompt causes jerky motion, dropped
actions, or fumbled sequencing in every model.

Split at natural sentence breaks. Never cut mid-sentence or mid-word. The last
word of a clip is a fully completed word at the end of a phrase, with about half
a second of pause before the cut. Never a mid-thought cut.

---

## 2. Clip-length ceilings (plan within these)

| Clip type | Target | Notes |
|---|---|---|
| Hook | 5–7s | |
| Talking head | 6–9s | lip-sync degrades past ~8s on most models |
| B-roll / product shot | 3–5s | silent |
| CTA / close | 4–6s | |

Hard caps by model: **Kling** ~10s, **Google Omni** ~10s (5–8s sweet spot),
**Seedance 2.0** ~15s. Never plan a single clip past its model's cap. If a line
runs long, split it at the cleanest natural pause.

Word budget follows a natural ~2–2.5 words/sec VO read: ~13–17 words per 6s,
~20–25 per 10s (Omni), ~30–37 per 15s (Seedance). Count per clip.

---

## 3. Start-frame asymmetry (the core concept)

Image-to-video models lock different things with different strength:

**STRONG lock from the start-frame image** — don't waste prompt words
re-describing these:
- face structure, skin tone, complexion
- outfit, clothing detail
- room / environment, set dressing
- lighting setup, colour temperature
- product appearance (if visible in the frame)

**WEAK lock — re-solved fresh from the text prompt every clip** — you MUST
respec these every time:
- voice, accent, delivery style
- camera behaviour, micro-movements
- lip-sync and the exact dialogue
- performance (gesture, expression, body language)
- audio environment (mic feel, room tone, compression)

Practical rule: lean on the image for visuals, lean on the text for performance,
voice, and motion.

**The model can only animate what is in the frame.** It cannot add an object from
nothing. If a clip needs the product in hand, the start frame must already show
it in hand. If something you planned didn't render in the still, either fix the
still or remove it from the clip prompt and negate it ("no bracelet visible").

**Start frames show the moment BEFORE the action, not the peak.** A frame already
at the top of a jump has nothing left to animate.
- ✅ hand reaching toward the product (animate the pickup)
- ❌ product already raised mid-gesture

---

## 4. Character lock

- **First image of a character** = the anchor. Describe fully. No lock line. Save
  it; every later image of that person references it.
- **Every later image of that character** = load the anchor as a reference and
  open the prompt with a **CHARACTER LOCK** line naming every anchoring feature
  explicitly: skin tone (hex if known), face shape, eye colour/shape, hair
  length/texture/colour/behaviour, 2–3 imperfections *with exact location*,
  wardrobe pieces, and the room + lighting.
- Text alone tops out around 80% face consistency — the reference image plus the
  explicit lock line is what closes the gap.
- What the lock holds reliably: face geometry, permanent marks, hair, skin tone,
  large garments, room, lighting. What it does **not** hold: rings on specific
  fingers, small accessories, intricate nails, small tattoo placement — describe
  those loosely or let the reference image carry them.

For **stylised characters** (Pixar / LEGO / low-poly / paper / whiteboard / 2D)
the lock names the *construction*: the parts combination, the palette, the
molded/printed/drawn features. For LEGO / whiteboard / 2D, expression is a
**discrete swap** (a separate locked still per face), never a morph inside one
image.

---

## 5. Voice lock

- **Separate VO track** (animated formats, or any format where you record
  externally and lay it over): one recording = automatic consistency. Keep a
  voice-direction card (who, tone, pace, accent, emotion mapped to beat ranges).
- **Native model voice** (Kling / Omni / Seedance generate the audio): paste the
  **audio block verbatim** into every clip of a sequence. Changing even one word
  drifts the voice. One locked block **per speaker** — never a shared block
  across two speakers, or they start to sound alike.
- **Default accent: American, and always a NAMED US region.** Every voice line
  names a specific American region ("Upper-Midwest", "Southern California",
  "Texas", "Boston") unless the user chose a different accent for the run
  (hard rule 17). Bare "General American" is not enough, and neither is an
  unstated accent. Give each speaker in a scene a *different* region so the
  voices stay distinct. Never "mid-Atlantic": it means the transatlantic,
  half-British accent. `qa.mjs lint` fails a spoken clip with no named region.
- **The start frame decides the accent more than the voice line does.** Voice
  is a weak lock re-solved from text; the room is a strong lock taken from the
  image (§3). Measured 2026-09-12 across 22 clips on Adsora Gen i2v:

  | Voice line | American-looking frame | British-looking frame |
  |---|---|---|
  | named US region | American 8/8 | American 3/3 |
  | bare "General American" | American 7/7 | **British 3/3** |
  | "mid-Atlantic American" | — | **British 1/1** |

  So an American voice needs an American *picture*: American words in every
  still prompt (sidewalk, parking lot, storefront, newsboy cap — never
  pavement, car park, shopfront, flat cap; the full list is
  `tools/qa-dialect.json`) and an American locale anchor on exterior shots
  ("a suburban Texas strip mall", "US license plates"). `qa.mjs lint` fails
  British vocabulary before a still is generated, and `qa.mjs clips` runs a
  local accent classifier on every spoken clip before assembly.
- **Accent lock rule (Kling especially):** the accent must appear in THREE places
  in every clip — the dialogue delivery note, the performance behaviour line, and
  the audio spec. Miss one and the accent drifts (usually toward generic or
  British/Australian).
- **Known limit:** Kling biases toward upbeat, energetic delivery and ignores
  "whisper", "murmur", "soft voice". For subdued lines, plan to replace the audio
  in edit, or rewrite for an energetic read. Omni and Seedance handle subdued
  delivery fine.

---

## 6. Product / label integrity

In every prompt where the product appears, include a product-integrity block with
the exact label text written out:

```
The product matches the reference image exactly: [name], [dominant colours],
[label text / layout]. Text, logo, layout, and colour values are identical to the
reference — no substitution, no AI-generated text, no morphing, no warping, no
drift. The label stays fully readable and unchanged. Product shape is [shape].
Movement is slow and linear — no spinning, no fast motion near the camera.
```

For stylised formats, the product is rebuilt in that style (a brick-scale prop, a
low-poly mesh, a paper cutout) but its **silhouette, proportions, and colour
blocking stay locked to the real product**, and its **label text is held out of
generation and composited in post** (models garble printed text). Only lock label
text into generation when the user uploaded a product image to lock against.

---

## 7. No-word-echo rule

The dialogue words exist **only** inside the quoted spoken line. Never repeat,
paraphrase, or echo a dialogue word anywhere else in the prompt. Native-audio
models read echoed words as extra things to say and will double the syllable,
wasting the generation. Reference moments by position or emotional beat instead:
- ❌ "eyebrows lift on 'grogginess'"
- ✅ "eyebrows lift during the payoff phrase near the end"

---

## 8. Performance = visible physical behaviour

Never write an abstract emotion label alone. Decompose it into muscle movement
and body position:

| Label | Direction |
|---|---|
| Warm | soft eye contact, gentle head tilt, relaxed jaw, small un-forced smile |
| Excited | quick micro-nods, eyebrows rise slightly on key words, subtle lean forward, eyes brighten |
| Skeptical | one eyebrow lifts, chin drops slightly, lips press together before speaking, slight backward lean |
| Surprised | eyebrows shoot up, mouth opens slightly, head pulls back a fraction, then a slow smile builds |
| Vindicated | eyes brighten, both brows rise, full smile showing upper teeth, slight forward lean, one nod |
| Concerned | brow furrows slightly, lips press, head tilts, posture stills |

If a line could be read two ways (joke vs. serious), add a visible cue that
disambiguates it. A clip with no performance language reads AI-generated no matter
how good the setup.

**Stylised exception:** a LEGO minifigure / whiteboard drawing / flat-2D figure
with a fixed face cannot do micro-expressions. Performance there is **whole-body
pose + the style's motion signature** (ratchet joints / draw-on strokes / held
cel frames), and the emotional shift happens by **cutting to a new clip that
starts from a still with the next face**.

---

## 9. B-roll is mandatory

No ad is talking-heads-only. Every sequence mixes:
- **Lifestyle B-roll** — the avatar's world, the problem in context.
- **Product B-roll** — the product in use, label/detail reveal, the result shown.

B-roll is what makes it feel like content, not an ad, and it gives the editor
cutaways to cover position jumps between talking clips. Plan it in from the start.

---

## 10. Continuity & frame chaining

- For clips 2+ in a continuous sequence, add a continuity block, worded
  identically every time: *"Continue from the exact final frame of the previous
  clip. Same room, same lighting, same posture family, same mic distance, same
  voice feel, same emotional lane. No reset, no new walk-up, no angle jump."*
  Omit it entirely for clip 1 or independently-generated clips (don't send
  contradictory signals).
- Models with **no cross-clip memory** (Omni, Seedance) hold continuity two ways:
  **frame chaining** (harvest a clip's last frame as the next clip's start frame)
  and pasting the verbatim style-lock + voice-lock into every clip. Reset internal
  timecodes to `00:00` each clip.
- Before writing each clip, run the director's continuity check: what was the
  person/object doing at the end of the last clip (posture, hands, gaze, props)?
  Where would they naturally be now? If the position jumped, is there a B-roll
  cutaway to cover it?

---

## 11. Negative constraints — targeted, not generic

Every clip prompt ends with 3–6 negatives **specific to that clip's format and
action** — high-cost failure modes only, not a boilerplate list.
- Talking head with product: "product label stays forward, mouth motion matches
  dialogue, no jerky hand movement, lighting does not flicker."
- Podcast two-shot: "neither speaker drifts position, mics stay in place, no angle
  shift, no background motion."
- B-roll product: "product shape does not morph, label text stays readable,
  lighting consistent, no hand-position drift."
- Stylised: "no realistic human skin, no facial morphing, no smooth CGI
  interpolation, no rendered captions or logos in frame."

For realistic UGC, always end with the pollution blocker: **"No phone, camera,
screen, social-media UI, floating text, or digital overlay visible anywhere in
the frame."** For image prompts add "No phone on the counter."

---

## 12. Realism anchors (live-action formats)

Every image prompt for a realistic still carries: "Hyper-realistic unedited human
skin, visible natural pores, fine vellus hair, realistic eye moisture and light
reflection. Zero AI smoothing, zero beauty filter, no retouching." Plus deep
focus ("deep focus on everything, zero bokeh, zero depth-of-field blur"), everyday
ambient light only (window / room / street shade / golden hour — never studio,
flash, ring light, softbox), a candid mid-action moment, a slightly imperfect
frame, and 2–3 real lived-in background objects. Never name a phone brand — use
"candid mobile camera quality". Never describe the camera as a physical object in
the scene — describe the angle only.

---

## 13. On-screen text discipline

**Nothing generated carries text, and the only text on the final is the
subtitle track.** Two separate halves, both absolute.

**In the prompt (every format, every model).** State it explicitly: "no
subtitles, no captions, no on-screen text, no logos, no watermarks, no signage
with readable words." A model asked for type produces warped, misspelled type
that cannot be fixed without a reshoot, so the picture is always clean. Never
name a typeface in a prompt.

**In the assembly pass.** Subtitles go on there, burned from the spoken audio in
the house spec (Gotham Black, one to three words and sixteen characters per
card, uppercase, white with the spoken word highlighted, word-timed by local
whisper.cpp). They are **on by default** with no `captions` block in the jobs
file; `"captions": false` is the only way off (hard rule 23,
`references/house-defaults.md` §2). There is no separate authored caption
layer: the script has no on-screen-text field, and a keyword card that restates
the voice is exactly the thing this rule removes.

**Graphics are not captions.** A persistent banner, an end card, a product-label
overlay, a comment bubble, a notes card, a caller-ID graphic and a before/after
label are designed objects with a job of their own. They are still specified in
Stage 4 and still composited in post by `tools/assemble.mjs` / `tools/card.mjs`,
never generated. Keep one face across every graphic in an ad.

**Text-first formats are the carve-out.** Wall of text + music, dancing person +
big text callout, moving background + centred captions, and reply-to-comment
exist because the type *is* the ad. There the on-screen copy is the script and
is written as such; where such a format also carries a voice, that voice is
subtitled as normal.

---

## 14. One spoken line per clip — trim inside a clip, never slice across lines

Every clip that speaks carries **exactly one** line: one quoted string in its
prompt. A scene of 40 lines is 40 speaking clips. Short, cheap and correct beats
long, efficient and wrong.

- **Why.** On 2026-09-12 a drama was built from takes holding two to four lines
  each and cut apart on whisper word timings. It shipped with the wrong line in
  two shots, clipped words, a punchline cut in half and five sub-second slivers.
  A slice point guessed inside a multi-line take can land on the wrong line, and
  nothing downstream can tell.
- **Trim inside the clip** with `qa.mjs trim`. With one line in the file, the
  cut is unambiguous: the first complete reading, found from the pauses in the
  audio. Not from whisper's word timings alone — on a repeated line they squeeze
  the whole second reading into zero time at the clip's end, so a timing-based
  trim keeps both readings.
- **Short lines repeat to fill the clip's floor** (Adsora Gen 5.2 s, Seedance
  4 s). A two- or three-word line comes back spoken twice. Trim to the first
  reading, or make the beat a silent reaction clip instead.
- **Reactions are their own mouth-closed clips** (SILENCE LOCK, no native audio),
  laid over the other speaker's line. Never harvested from pauses inside a
  speaking take.
- **The same person in every still passes their anchor as a reference**
  (`image_urls`). Re-describing someone in text, however precisely, gives you a
  cousin: a second Carl with glasses, three different interviewers.

Enforced by `tools/qa.mjs`: LINE-COUNT and IDENTITY at `lint`, REPEAT and
HEAD-LEAK at `clips`, SLICED-TAKE, MICRO-CUT, MISMATCH and DUPLICATE at `final`.
