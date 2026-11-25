# Format Module — Simpsons-Style / Flat 2D Animated  *(authored for this engine)*

A flat, cel-shaded 2D cartoon ad in the "flat suburban sitcom cartoon" idiom:
thick even black outlines, flat colour fills, at most one cel-shadow tone, a
limited palette, snappy limited animation (held frames, motion on twos). Each
concept, ingredient, feature, or problem can be its own talking cartoon
character, or a single cartoon avatar acts out the beats.

No existing skill covers this. It is modeled on the character-consistency
approach of the Pixar-style character module — a locked model sheet, real things
as characters, a connected story, discrete redrawn expressions — but rebuilt for
**2D cel animation** instead of 3D render.

**Engine stack:** character model sheet + expression stills in an image model
(any capable 2D/cartoon model) → Kling or Google Omni image-to-video with a
2D-cel motion constraint → VO per character (native model voice or ElevenLabs) →
assembly + captions in the editor. Read `references/production-discipline.md`
first.

---

## Legal / originality guardrail
Use the *aesthetic* (bold outline, flat colour, overbite mouths, four-finger
hands, flat pastel suburban palette). **Do not** reproduce any specific
copyrighted show's characters, names, logos, settings, or exact character
designs. Every character is original and generic. If the user asks for a named
show character or an exact likeness, decline and offer an original character in
the same style.

---

## When this format fits the DNA
A mechanism that splits cleanly into 3–5 named parts (character-per-concept
mode) · a relatable domestic/office problem you can stage as a cartoon scene
(avatar mode) · comedy tolerance · a benefit stack you can split one-per-character.

Two sub-modes:
- **Character-per-concept** (default — mirrors the Pixar module). Each real thing
  (the fee, the craving, the competitor, the ingredient, the product) is a
  talking cartoon character delivering 1–2 sentences straight to camera.
- **Avatar scene**. One cartoon person acts out the competitor's beats in flat
  cartoon locations (a kitchen, a cubicle, a couch).

---

## Production rules

1. **Characters are REAL things, never invented mascots** (same rule as the Pixar
   module). The organ, the ingredient, the fee, the competitor, the actual
   product. To represent an abstraction, use the body part or object responsible.
2. **Identity in one beat, benefit as a feeling.** `"I'm [thing]. [1–2 sentences
   about what changes for YOU]."` Spoken TO the viewer. Plain words, no mechanism
   language. Max 2 sentences per non-brand character, 3–4 for the brand closer.
3. **Connected story.** Each line answers the one before: villain states the
   problem → hero answers *that* problem in the same words → brand says how to
   get it. Carry the competitor ad's beat order onto villain → hero → brand.
4. **Villains are cocky, not menacing.** Smug, comfy, "I'm not going anywhere."
5. **The 2D model sheet is the lock.** For each character, generate a turnaround
   sheet (front, 3/4, side) as the anchor still. Lock: outline weight, every flat
   fill colour as a hex, hair as a single solid silhouette shape, wardrobe as
   flat shapes, one signature accessory, body proportions. Every later still of
   that character opens with a CHARACTER LOCK naming all of it + loads the model
   sheet as a reference.
6. **Expressions are REDRAWN, not morphed.** Generate a small expression set per
   character — neutral, surprised, delighted, annoyed/smug — each as its own
   locked still. An emotional shift across a clip happens by **cutting to a new
   clip** that starts from the next expression still. Within a clip, the face
   holds; mouth moves for lip-sync only.
7. **Lip-sync = a limited mouth chart**, not realistic mouth motion: rest,
   open-A, wide-E, round-O. State "classic limited-animation mouth shapes,
   4-position mouth chart, no realistic lip motion."
8. **Motion is limited animation.** Animate on twos or threes, hold key poses,
   snappy transitions between a small number of poses, a tiny settle. NO smooth
   interpolation, NO rubber-hose easing, NO 3D. Outline weight stays constant;
   flat shapes stay flat; the one cel-shadow tone does not gradient.
9. **Palette lock.** A limited flat palette (6–10 colours), stated as hex, held
   across every character and background. One cel-shadow tone per colour, max.
10. **Backgrounds are flat and simple** — a few flat shapes, one flat sky/wall
    colour, minimal detail. Plain uncluttered background behind a talking
    character.
11. **Clip length:** 5–8s per character (character mode) or per beat (avatar
    mode). 9:16. One character / one action per clip.
12. **Product:** the brand/product character (character mode) or a flat 2D prop
    (avatar mode) — rebuilt as a flat cartoon object with the real product's
    silhouette and colour blocking locked. Brand name / logo **held out of
    generation, composited in post**, unless a product image was uploaded to lock.
13. **No text in the render.** Prompts ban on-screen text, captions and
    lettering outright; hand-cartoon type comes back malformed. The finished
    ad's only text is the burned subtitle track, word-timed from the VO in the
    house spec, on by default (hard rule 23).

## Negative constraints (stills and clips)

```
no 3D, no rendered depth or perspective camera, no gradient or soft shading
beyond a single flat cel-shadow tone, no smooth interpolation or heavy
in-betweening (keep limited animation, motion on twos, held frames), no
rubber-hose easing, no variable or sketchy outline weight (outline stays even and
clean), no photorealism, no realistic lighting, no lens blur or motion blur, no
copyrighted or trademarked character likeness, no named show characters, no
rendered logos or full-sentence captions in frame, no colours outside the locked
palette, no extra characters entering a single-character clip
```

## Paste-ready skeletons

### Image — character model sheet (anchor, NEW)

```
A 2D flat cel-animation character model sheet, three views in a row (front view,
three-quarter view, side view), plain off-white background, vertical 9:16.

Character: a [personality adjective] anthropomorphic [real thing / a cartoon
person], drawn in flat suburban-sitcom cartoon style — thick even solid black
outline of constant weight, flat colour fills with a single flat cel-shadow tone,
no gradients. [Body: shape, proportions, overbite mouth, four-finger hands.]
[Exact flat colours as hex: skin/surface #___, hair/top shape #___, clothing
#___, accent #___.] Hair is one solid silhouette shape. Wardrobe is flat shapes.
Signature detail: [one accessory or feature]. Neutral expression.

Limited palette, flat lighting, clean vector-like linework but hand-drawn feel,
no 3D, no rendering, no background scene. 9:16 vertical.
Negative Prompt: [the negative list above].
```

### Image — one expression still (LOCK to the model sheet)

```
A single 2D flat cel-animation character portrait, plain flat [colour] background,
vertical 9:16.
CHARACTER LOCK — same character as the model-sheet reference. Same constant-weight
black outline, same flat fills [skin #___, hair #___, clothing #___, accent
#___], same hair silhouette, same wardrobe shapes, same signature detail, same
proportions and overbite. Do not change any colour or the outline weight.
Expression for this still: [SURPRISED — brows up, eyes wide circles, mouth open
'O' / DELIGHTED — eyes happy arcs, open smile / SMUG — half-lidded eyes, flat
smirk, arms crossed]. Facing camera, chest-up framing, one signature pose.
Flat lighting, single cel-shadow tone, no gradient, no 3D, no background scene.
9:16 vertical.
Negative Prompt: [the negative list above].
```

### Video — talking character clip (Kling image-to-video; image already loaded)

```
Realistic 9:16 flat 2D cel-animation clip. Animate the referred cartoon character
image: the character looks directly into camera and speaks the words "[EXACT
DIALOGUE, punctuation removed]" using classic limited-animation mouth shapes, a
4-position mouth chart (rest, open-A, wide-E, round-O), no realistic lip motion.
The single dominant action is [one signature gesture — a smug arm-cross settle /
a small lean-in / one hand rising to a shrug and back]. Animate on twos, hold key
poses, snappy transitions between a few poses with a tiny settle. The face
expression does not change from the still. Outline weight stays constant, flat
fills stay flat, the single cel-shadow tone does not gradient, the flat
background does not move. Native audio, [voice descriptor: e.g. "smug bored
low male voice" / "warm bright female voice"], lip-synced to the line. No
background music, faint flat room tone.
Negative: no 3D, no smooth interpolation, no rubber-hose, no gradient shading, no
outline-weight change, no extra characters, no floating text or captions, no
camera move, no photoreal rendering.
```

### Video — Omni variant

Use the 16-block brief with: Identity Lock to `@image1` (the expression still),
Environment Lock = "flat single-colour cartoon background, unchanged", Camera =
"locked-off, no move", Performance Vibe = the character's energy in one line,
per-line choreography as *pose beats* not muscle beats (the face is fixed), Voice
+ Dialogue verbatim, Style = "flat 2D cel animation, limited animation on twos,
constant black outline, flat fills, one cel-shadow tone", plus the negative list.

### Script block (goes in 04-prompts/simpsons-flat-2d.md and feeds the VO)

```
Character 1 — [real thing] ([flat colours, one-line look]):
"I'm [thing]. [1–2 sentence feeling-benefit, TO the viewer]."

Character 2 — [real thing] ([look]):
"I'm [thing]. [answers Character 1's problem in the same words]."
...
Brand — [product as flat cartoon object] ([real brand colours]):
"And I'm [BRAND]. [How to get it]. [Price]. [Optional social proof]."
```

## Assembly notes
Generate every character's model sheet first, then each character's expression
set as locked stills. Then Kling/Omni one clip per character in script order.
VO per character (match voice to personality). In the assembly pass
(`tools/assemble.mjs`, run by the skill): clips in script order, full audio
underneath, word-highlighted karaoke captions, export 1080×1920.
For avatar-scene mode, build a background-plate still per location and a pose
still per beat, LOCK the avatar across all of them, and animate beat by beat with
the same limited-animation motion constraint. The persuasion DNA is carried by
the order and connection of the lines — keep the competitor ad's beat sequence.
