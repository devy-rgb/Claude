# Format Module — Expert Caught In The Moment

A trusted third-party expert (stylist, dentist, trainer, mechanic, esthetician)
notices a problem mid-service and recommends the product on the spot. Plays as a
real candid moment, not a scripted testimonial. The expert's authority — "I see
hundreds of these" — is what makes the recommendation land.

**Engine stack:** Nanobanana Pro stills (with GPT Image 2 recreations as a cross-
model option) → Google Omni (16-block, native audio, ~10s cap; scene-extension
chain for continuity). Read `references/house-playbook.md` and the full worked
example in `references/house-workflows/expert-caught-in-moment.md` first.

---

## When this format fits the DNA
PAS (Pain → Agitate → Solution) delivered through a third-party expert rather
than a direct-to-camera testimonial · a problem that "shows up here first, before
you'd notice" · a product a professional would actually hand a client. If the
competitor ad has a trusted-figure recommendation inside a real-feeling scene,
this is the rebuild.

---

## Production rules

1. **Two anchored characters** — the expert and the client — first appearing in
   one anchor still that becomes the Character Reference for everything after.
   Both **average-pretty, no glamour treatment** (the un-glam look is what sells
   "real").
2. **Reference images build on each other**:
   - Anchor (e.g. a mirror shot, both characters, the full service environment).
   - Borrowed-pose shot: **dual reference** — a real photo as a
     **Style/Composition reference** (pose + crop + camera framing only) + the
     anchor as the **Character reference** (who + what the place looks like).
     Add a **COMPOSITION LOCK**: "match the pose and framing of the style
     reference exactly. Do not copy the people, wardrobe, or background from it —
     only the pose, crop, and camera framing."
   - Neutral-pose variant: "POSE CHANGE ONLY — everything else stays identical."
3. **Camera completely static, locked-off, zero drift** — every clip, verbatim.
   For a mirror scene, extend the no-device negative to **reflections**: "no
   phone, tablet, or camera device visible anywhere in frame at any point,
   including reflections."
4. **One prop action per clip.** The product comes out of a drawer / off a
   surface into the client's hands in the first second of the solution clip; a
   single finger-tap lands on a specific word; then hands off. "The jar does not
   swap hands, disappear, or morph." In later clips it **stays in the client's
   hands** — the expert does not take it back.
5. **Mouth-closed lock for the non-speaking character** in any clip where only
   one talks: "[Name]: no dialogue. Mouth stays closed and still the entire time.
   No talking, no mouthing." Also in the negatives.
6. **Do not ask the video model to do edit-layer effects**: "Do not generate a
   split-screen before/after inside [model] — that is an edit-layer cut."
7. **Product = a Visual/Product Reference** (`@image2`) loaded alongside the
   character anchor for every clip it appears in. "If @image2 is loaded, that is
   the exact [product] — preserve label text, colour, and shape exactly. Do not
   invent a different bottle."
8. **Voice written to the character's established personality**, not to any
   group stereotype — state this explicitly in the VOICE block.
9. **Continuity**: all clips share Identity/Outfit/Environment locks; only Scene
   Description, Performance, Dialogue, Timing change per clip. Consider an Omni
   **scene-extension chain** (10s increments, 40s cumulative cap) for
   consecutive clips instead of separate fresh briefs — split into two segments
   if the total runs past 40s.
10. **CTA + risk-reversal** in the client's decision line + the expert's
    knowing button ("everyone says that the second they see their part like
    this"). Captions and any before/after comparison added in the assembly
    pass (`tools/assemble.mjs`: captions + a `split` clip), not the video model.

## Negative constraints (pool — 4–8 targeted per clip)

```
no subtitles, no captions, no on-screen text, no logos, no watermarks, no VFX,
no CGI look, no 3D, no cartoon, no beauty filter, no skin smoothing, no HDR, no
cinematic colour grade, no artificial sharpening, no face morphing, no identity
drift, no wardrobe changes, do not remove or change [the expert's glasses /
earrings], no prop morphing, no jar swapping hands, no second jar, no unreadable
or changing label, the non-speaker's mouth stays closed and still with no lip
movement or mouthing, no split-screen, no before/after composite, no camera
movement of any kind (completely static shot, no dolly/push-in/orbit/pan/tilt/
zoom/drift), no extra fingers, no warped hands, no flicker, no jitter, no camera
glitches, no phone/tablet/camera device visible anywhere in frame at any point
including reflections
```

## Paste-ready skeletons

### Still — anchor (NEW, both characters, Nanobanana Pro)

```
Hyper realistic candid UGC phone-propped shot ONLY (no bokeh, no portrait mode):
[The service setting shot in a mirror / from a natural third-person angle], phone
[propped against a counter facing the chair]. [High-end lived-in detail: 3–4
named real objects, the light source and rough temperature].
[EXPERT], a [age] [role], [hair], [glasses/earrings], [face shape + skin tone +
stubble], naturally above-average but not model-glam, genuine warm expressive
face. Wearing [garment], [a comb tucked behind one ear]. He [stands behind the
chair, leaning in close over the client's head, both hands parting her hair at
the crown], eyebrows drawn slightly, mouth open mid-sentence, genuine concerned
expression — not posed, caught mid-reaction.
[THE CLIENT], a [age] [person], naturally pretty but not a model face, no
glamour treatment, [hair + skin tone], seated in the [chair] wearing [a cape with
faint "STUDIO" lettering], looking [up toward the mirror] with a slightly
startled, curious expression.
[If a mirror: Mirror reflection shows both of them plus the reversed background —
2–3 named objects.] Framing slightly off-centre and tilted, like a phone casually
leaned. Warm ambient lighting ~3800K, soft even shadows, polished but not
studio-flat. Candid mobile camera quality, natural colour, mild compression,
slight sharpening. Deep focus, both figures and background sharp, no artificial
blur.
No beauty filter, no skin smoothing, no studio lighting, no ring light, no
portrait mode, no bokeh, no glam makeup on either subject, no third person in
frame. No phone visible anywhere in frame. No phone on the counter, no phone in
the mirror reflection.
```

### Still — borrowed-pose hook shot (dual reference)

```
📌 Before generating — load in Nanobanana Pro:
→ Composition/Style reference: [a real photo with the pose/crop you want], set as
  Style/Composition Reference — controls POSE and FRAMING only, not people or place.
→ Character lock: the anchor image, set as Character Reference — controls WHO and
  what the place looks like.

Hyper realistic candid UGC [side-angle] shot, filmed handheld by a third person
ONLY (no bokeh, no portrait mode):
CHARACTER LOCK — these are the same two people, same everything as the character
reference image. [EXPERT: every locked feature.] [CLIENT: every locked feature.]
Do not change these features.
COMPOSITION LOCK — match the pose and framing of the style reference image
exactly: [tight side-angle crop, camera close and roughly chest-height, angled
slightly upward, both faces filling most of the frame in near-profile, one hand
on top of the other person's head to hold it steady, the other hand working at
the hairline, faces leaned in close]. Do not copy the people, wardrobe, or
background from the style reference — only the pose, crop, and camera framing.
[The scene described with the locked characters in that pose.] Real [service]
background softly receding from natural room depth — background softness from real
distance, not lens blur. Warm ambient indoor lighting ~3800–4000K. Framing
slightly off-centre, a little tilted, subtle handheld imperfection, close and
intimate rather than posed. Candid mobile camera quality, natural colour, mild
compression, slight sharpening. Both faces and hands sharply in focus; only the
far background softens from real distance.
[Same negatives as the anchor, plus: no visible mirror or reflection.]
```

### Clip — solution + product reveal (Omni 16-block)

```
FORMAT: Create an 8-second vertical 9:16 realistic UGC video.
QUALITY / FIDELITY LOCK: Use the exact same lighting, texture, and phone image
quality as the reference image. No sharpen, no skin enhance, no beauty filter, no
smoothing, no HDR, no polish, no clarity, no colour grade. Raw, organic, true to
the reference — same warm indoor ambient lighting, natural softness, realistic
exposure, imperfect smartphone texture, authentic [salon] atmosphere.
IDENTITY LOCK: Use @image1 as the exact identity and scene reference for both
people. [EXPERT: preserve every locked feature and overall likeness exactly.]
[CLIENT: preserve every locked feature exactly.] Do not alter either face.
If @image2 is loaded, that is the exact [product] — preserve label text, colour,
and shape exactly. Do not invent a different bottle.
OUTFIT LOCK: [Expert stays in X — do not change it, do not add or remove the
glasses or earrings.] [Client stays in the cape with faint "STUDIO" lettering.]
ENVIRONMENT LOCK: Keep the environment consistent with @image1: [every named
object]. The setting stays real and unchanged.
SCENE DESCRIPTION: [Same setting]. He reaches to [the station drawer beside him],
pulls one [jar], puts it in her hands.
BACKGROUND OBJECTS: One [product] only. Label must stay readable and unwarped. No
second [jar]. [Other bottles on the counter stay put.]
CAMERA: Completely static, locked-off phone held by a third person from the side,
roughly chest-height, angled slightly upward, matching @image1's close side-angle.
The camera does not move at all for the entire clip — no drift, no dolly, push-in,
pull-out, orbit, pan, tilt, or zoom, not even a subtle micro-movement. Frame
stays fixed from first frame to last.
CAMERA REVEAL BEAT: None. The [jar] enters frame from the drawer at his hip — no
camera move to find it.
PERFORMANCE VIBE + ACTION: [The theatrical warmth comes back — his "I already
have the fix" beat.] He reaches into [the drawer] with his right hand only,
pulls out one [jar], places it into the client's hands. Then one finger taps the
label. His left hand rests at his side — not a second prop.
[Expert]: "[line — why he puts his clients on it]" — [jar] lands in her palms,
little proud smile.
[Expert]: "[line — the mechanism in plain words]" — single tap on the label on
"[keyword]", then hands off. She holds the [jar] with both hands. The [jar] does
not swap hands, disappear, or morph.
[Client]: no line. Looking at the [jar], curious. Mouth stays closed and still.
VOICE: [Expert]'s voice — [written to his established personality: animated,
expressive, higher-energy by default, quick inflections, playful lift — not a
stereotype of any group]. Close phone-mic, [salon]-roomy, unpolished. Not
announcer, not flat.
DIALOGUE: [Expert] says exactly, with accurate lip sync and natural pacing:
"[both lines]"
TIMING / PERFORMANCE BEAT: Drawer reach in the first second. [Jar] in her hands
before the product name. Label tap on "[keyword]". Clip ends on her holding the
[jar].
AUDIO / ENVIRONMENT SOUND: Realistic phone-mic [salon] audio — [faint distant
blow-dryer], soft room tone, a tiny plastic-jar tap when his finger hits the lid,
no music. No crowd, no city, no cinematic sound design.
STYLE: Authentic TikTok/Reels UGC. Raw smartphone footage. Natural skin texture.
Slightly imperfect realism. Believable candid [salon] moment.
NEGATIVE CONSTRAINTS: [pool above], plus: no [jar] swapping hands, no second
[jar], no unreadable or changing label.
```

### GPT Image 2 recreation (cross-model still)

```
Recreate this reference photo as closely as possible — same two people, same
[service] setting, same close side-angle framing and camera position, same warm
ambient lighting and background. Match it faithfully rather than reinterpreting it.
[The one change for this variant, e.g. "his hands rest flat and still on top of
her head, not woven into individual strands; both expressions calm and neutral".]
Keep everything else identical to the reference: [every locked feature of both
people, the background, the crop, the ~3800–4000K lighting].
Photorealistic, natural skin texture, realistic proportions and hand anatomy, no
beauty retouching, no studio flash or ring light, no artificial portrait-mode
blur — only natural background softness from real room depth. No phone visible
anywhere in the frame.
```

## Assembly notes
Generate the anchor → borrowed-pose hook shot → neutral/variant stills → clips in
cut order (or a scene-extension chain for consecutive beats). Product image
(`@image2`) loaded for the solution/proof/CTA clips. Any before/after comparison
and all captions go in the assembly pass (`tools/assemble.mjs`), not the video
model. Static camera, hard cuts.
