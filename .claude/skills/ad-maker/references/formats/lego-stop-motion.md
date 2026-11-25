# Format Module — LEGO Minifigure Stop-Motion

The whole ad lives inside one brick-built LEGO universe. Minifigure characters, a
brick-built set, a real photographed physical stop-motion look (tactile plastic,
macro depth of field, warm practical light, the stop-motion snap).

**Engine stack:** stills in Nanobanana Pro (**style-override mode**, not
hyper-real-human mode) → Google Omni (native voiceover, ~10s cap per clip, no
cross-clip memory). Read `references/production-discipline.md` and
`references/model-specs.md` (Nanobanana style-override + Omni) first.

---

## When this format fits the DNA
A relationship / lifestyle pain that has a clear "villain" (the restless partner,
the bouncing pet, the pushy salesperson) · a product with a demonstrable
physical proof · playful tolerance. The comedy of rigid-body puppets dramatizing
the problem is the hook.

---

## Production rules

1. **Find the emotional villain.** Ask what the product *absorbs, blocks, or
   protects against*, then make that a minifigure or LEGO animal whose stiff
   rigid-body comedy dramatizes the problem.
2. **One idea + one action per clip.** 20–25 spoken words per 10s clip, hard max.
   Read the whole VO aloud as one block before generating.
3. **Minifigures do not emote like humans.** A minifigure has a fixed printed
   face. Performance is three things only:
   - **A discrete printed-face swap** — sleep face / worried face / neutral face
     / delighted face. Each distinct expression is its own locked still, never a
     morph. Emotion shifts by *cutting to a new clip* that starts from the next
     face.
   - **Whole-body pose** — arms up, lying flat, stiff lean, mid-jump, hip-pivot
     sit. The body carries what the face cannot.
   - **Rigid-body ratchet motion** — arms rotate at the shoulder, legs at the
     hip, hands twist at the wrist, head spins. NO elbow bend, NO knee bend, NO
     spine flex. Omni must be told this or it flexes them like humans.
4. **CHARACTER LOCK names the parts combination** — molded hair piece (with a
   located detail), printed torso design, yellow head, claw hands, plus which
   **printed face** this still uses. Generate the expression set up front as
   locked anchors.
5. **The proof clip is the money frame.** Find the product's demonstrable
   physical proof, give it its own clip near the end: the thing the product
   blocks shown failing to get through, tight on the product, villain acting in
   the background, silent or near-silent, claim captioned in post. State the
   non-motion explicitly ("the glass stays perfectly still, the surface does not
   ripple").
6. **STYLE LOCK block pasted verbatim into every Omni clip** (below). This stops
   Omni "upgrading" the plastic puppet into smooth 3D or realistic humans.
7. **Voice lock verbatim every clip.** Omni handles a weary/subdued VO fine.
8. **All text out of generation.** Burn VO captions and brand/label text in post.
   The only printed text from generation is the minifigure face, locked per still.
9. **Product:** a brick-scale plastic prop; silhouette + colour blocking locked
   to the real product; label face left blank, real label composited in post
   (unless a product image was uploaded to lock).
10. **Frame chaining** for continuity (harvest each clip's last frame as the next
    clip's start frame). Reset internal timecodes to 00:00 each clip.

## Negative constraints (stills and clips)

```
realistic human skin, human faces, facial muscle movement, morphing expressions,
bendable elbows or knees, spine flex, flowing hair, fabric cloth, smooth CGI,
glossy plastic render look, claymation, photoreal humans, studio strobe lighting,
ring light, flat overhead light, printed captions or subtitles in frame, brand
logos or label text rendered by the model, digital bokeh, faked depth-of-field
blur
```

## STYLE LOCK block (paste verbatim into every Omni clip)

```
— STYLE LOCK (keep verbatim on every clip) —
Stay inside one physical LEGO brick-built universe shot as stop-motion. Every
character is a rigid plastic LEGO minifigure with a yellow cylindrical head, a
fixed printed face, a molded plastic hair piece, a printed torso, C-shaped claw
hands, and ratchet joints that rotate only at the shoulder and hip. No elbow
bend, no knee bend, no spine flex, no facial morphing, no realistic human skin.
Hard ABS plastic with visible studs and mold seams. Stop-motion cadence at a
~12 to 15fps feel with a tiny settle and micro rotational jitter as each pose
lands, slight handheld camera wobble. Macro-lens tabletop-diorama look, shallow
real depth of field, warm practical lamp light. Do not smooth into CGI, do not
turn the minifigures into realistic people.
ASPECT: 9:16 vertical.
```

## Paste-ready skeletons

### Still — minifigure, default face (Frame A, NEW anchor, Nanobanana style-override)

```
Hyper realistic macro-lens photograph of a physical LEGO brick-built diorama,
vertical 9:16.
SET: [brick-built location — e.g. a brick bed frame, brick walls, a molded
curtain, a small brick lamp], 2–3 named brick props, all surfaces hard plastic.
SUBJECT: one LEGO minifigure — [molded hair piece: colour, length, located
detail], [printed torso: exact print, colours, collar], yellow cylindrical head
with the NEUTRAL printed face (open dot eyes, straight simple mouth), C-shaped
claw hands. Pose: [stiff standing / sitting hip-pivot], the moment BEFORE the
action, not the peak.
CAMERA: three-quarter low angle, macro-lens feel, shallow real depth of field,
no digital blur.
LIGHT: warm practical lamp, soft, from [direction], ~3200K.
— LEGO STYLE TAIL (keep on every still) —
Hard ABS plastic with glossy-matte finish, visible studs and mold seams, subtle
subsurface plastic sheen, photographed physical stop-motion miniature, warm soft
practical light, shallow real macro depth of field. Reads as a real photographed
LEGO set, not a CGI render, not a realistic human, not claymation. Vertical 9:16.
Negative Prompt: [the negative list above].
```

### Still — same minifigure, next face (LOCK to A)

```
[same opener]
CHARACTER LOCK — same minifigure as the reference image. Same molded hair piece:
[detail]. Same printed torso: [detail]. Same yellow head and claw hands. Same
printed face: WORRIED face (open dot eyes, one printed raised brow, downturned
mouth). Same set: [surface, 2–3 brick props, wall]. Same warm lamp light. Do not
change the parts, do not add human features.
[pose for this beat — the moment before the action]
[camera + light + LEGO STYLE TAIL + Negative Prompt]
```

### Clip — Omni (flowing prose, ≤10s)

```
A [7]-second stop-motion LEGO clip, vertical 9:16. Use the attached image as the
opening keyframe — match the hard plastic textures, visible studs, palette and
warm lamp light precisely. In frame: the minifigure with [hair piece] and
[torso print], [printed face for this clip], on the brick bed.

00:00–00:07 — ONE rigid-body action: [e.g. the minifigure launches straight up
off the mattress, arms snapping up from the shoulders as one piece, legs
straight, then lands with a small bounce and a micro rotational jitter as the
pose settles]. The printed face does not change. Body language carries the
emotion: [stiff, arms-up, head tilted back].

VOICEOVER ([warm weary male, English]): "[line for this clip, ≤25 words,
verbatim from 03-rebuild.md]"

State constraints: the printed face stays fixed, the hair piece stays solid, the
torso print stays identical, the camera angle holds; studs catch the lamp light,
a mold seam is visible.

AUDIO: stop-motion foley — soft plastic clacks, tiny brick taps, a gentle settle
on landing. [Voice lock, verbatim every clip: "warm weary male English voice,
natural pace, close and intimate."] No background music.

[STYLE LOCK block, verbatim, from above]

Negative: no elbow or knee bend, no facial morphing, no flowing hair, no smooth
CGI, no realistic human skin, no rendered captions or logos.

[If clip 2+:] Continue from the exact final frame of the previous clip. Same
brick set, same lamp light, same minifigure parts and printed face, same voice.
No reset, no angle jump.
```

## Assembly notes
Generate the full expression set per character as locked anchors, plus the set
and product-prop stills. Then Omni clip by clip in cut order, frame-chaining the
last frame of each into the next. The proof clip gets its own slot near the end,
tight and near-silent. Composite the real product label onto the clean prop face
in post; burn centered VO captions for muted viewing; caption the proof claim.
