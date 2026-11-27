# Format Module — Paper-Collage Stop-Motion

A short vertical ad told inside one handcrafted paper-collage universe. Cut-paper
characters and props, torn edges, fold creases, soft natural shadows, a muted
editorial palette. A problem-to-product story in cut paper.

**Engine stack:** still keyframes in an image model (GPT Image 2, or any capable
model that holds a craft-collage look) → Google Omni (native voiceover, ~10s cap
per clip, no cross-clip memory). Read `references/production-discipline.md` and
`references/model-specs.md` (Omni) first.

---

## When this format fits the DNA
A quiet, empathetic problem → insight → relief arc · a mechanism that's easier
*shown* than told · a calm brand tone. Motion-graphic variant (icons, labels,
arrows, no character) when the DNA is more explainer than story.

---

## Production rules

1. **Narrative or motion-graphic?** Narrative = a paper character living in
   scenes. Motion-graphic = icons, labels, arrows, no character. Pick one at the
   start (matches the DNA: story-led vs explainer-led).
2. **One idea + one action per clip.** The moment a clip does two things the
   animation turns to mush.
3. **Word budget: 20–25 spoken words per 10s clip, hard max** (~2–2.5 w/s; a 6s
   clip ≈ 13–17 words). Count per clip; move overflow to another clip. Read the
   whole VO aloud as one continuous thought before generating.
4. **Write the locks once, paste them everywhere.** A CHARACTER LOCK (age, build,
   beige paper skin, hair with a *located* detail, brow style, eye style, exact
   wardrobe described as paper) and a WORLD LOCK (wall colour, accent colour,
   lighting, palette restricted to the muted set). Located details
   ("receding hairline, bare scalp at the crown"), never vague ones.
5. **STYLE LOCK block verbatim in every Omni clip** (below) — stops Omni
   "upgrading" the paper puppet into smooth 3D mid-clip.
6. **Lock the voice descriptor word-for-word** across every clip with the same
   narrator (e.g. "warm, weary male, English"). Omni handles subdued delivery.
7. **No text in the render. Subtitles go on in post.** State in the prompt:
   no subtitles, no captions, no on-screen text, no torn-paper headlines, no
   brand labels. Paper-stamped type looks tempting in this style and still comes
   back misspelled. The finished ad's only text is the burned subtitle track,
   word-timed from the VO in the house spec, on by default (hard rule 23); a
   graphic the ad genuinely needs is composited by `tools/assemble.mjs`.
8. **Match the verb.** If the line says "drops", something literally drops. If
   "sweeps", a line sweeps. Literal beats clever.
9. **Colour carries emotion.** One "problem" tone and one "relief" accent from the
   muted palette, traded across the ad without breaking the restrained look.
10. **Product:** default is to reveal onto a **blank paper plinth** and composite
    a real photo of the product onto it in post (one real-texture object in an
    all-paper world lands hard). If a product image is uploaded to lock: analyze
    it, describe it as a clean paper cutout, add the lock line, keep it consistent
    across clips.
11. **Continuity:** frame chaining (harvest each clip's last frame as the next
    clip's start frame) if the user wants seamless; otherwise independent scenes
    consistent in style only. Reset internal timecodes to 00:00 each clip.

## Negative constraints (stills and clips)

```
no 3D, no realistic humans, no smooth digital animation, no photographic realism
on characters, no full-sentence captions or subtitles, no brand logos or label
text rendered by the model, no bright saturated colour outside the muted palette,
no glossy plastic look, no vector-flat cleanness (keep torn edges, fibres,
creases, soft shadows), no character transforming into a realistic form
```

## STYLE LOCK block (paste verbatim into every Omni clip)

```
— STYLE LOCK (keep verbatim on every clip) —
Stay inside one handcrafted paper collage universe. No 3D, no realistic humans,
no smooth digital animation. Every object hand-cut from textured paper with
visible fibers, wrinkles, shadows and imperfect edges. Keep all characters as
layered paper cutouts, do not transform into realistic forms. Stop-motion at a
~12fps feel, slight handheld wobble, every paper element lands with a subtle
bounce and tiny rotational jitter.
ASPECT: 9:16 vertical.
```

## Paste-ready skeletons

### Image keyframe (GPT Image 2 / image model)

```
A handcrafted paper collage illustration, minimalist editorial scrapbook style,
vertical 9:16.
[SETTING + LIGHTING — e.g. "a small paper living room, warm low side light".]

[SUBJECT — built entirely from layered paper cutouts. Paste the CHARACTER LOCK,
then add the pose and expression for THIS beat. Start frame shows the moment
before the action.]

[ENVIRONMENT / PROPS — every object described as cut paper, 2–3 named.]

— STYLE TAIL (keep verbatim on every frame) —
Muted neutral palette: warm creams, beige, sage green, dusty pink, kraft brown,
soft black typography. Scandinavian editorial aesthetic. Stop-motion paper craft
look. Realistic handmade collage with paper fibers, torn edges, fold creases and
soft natural shadows. Clean composition. Vertical 9:16.
```

Locks (write once, reuse):
```
CHARACTER LOCK: [age, build], beige paper skin, [hair with a located detail],
[brow style], [eye style], [exact wardrobe described as paper].
WORLD LOCK: [wall colour], [accent colour], [lighting], palette restricted to the
muted set, no bright colour.
```

### Video clip (Google Omni, ≤10s)

```
A [8]-second paper-collage motion explainer, vertical 9:16. Use the attached
image(s) as the [opening / opening and closing] keyframe(s) — match torn paper
textures, layered cardstock, muted palette and stop-motion handmade look
precisely.

00:00–00:04 — [ONE action, matching the verb in the line].
VOICEOVER ([warm weary male, English]): "[line for this clip, ≤25 words,
verbatim from 03-rebuild.md]"

00:04–00:05 — [TRANSITION: hard cut / page flip / tear / scrap dissolve].

00:05–00:08 — [ONE action].
VOICEOVER: "[next line]"

AUDIO: [SFX per beat: paper rustles, stamps, flutters, tears]. Calm ambient
texture underneath, no music drop.

[STYLE LOCK block, verbatim, from above]
```

## Assembly notes
Generate keyframes in order, attaching a loved frame as a reference for the next
frame with the same character/setting. Omni clip by clip; frame-chain the last
frame into the next if seamless continuity was chosen. Reveal the product onto a
blank plinth, composite the real product photo in post keyed to bounce as the
plinth settles. Burn centered VO captions for muted viewing. Motivated
transitions: a clip that pushes toward something hands to the next clip that
opens on it; a tear at the end of one clip rips into the next.
