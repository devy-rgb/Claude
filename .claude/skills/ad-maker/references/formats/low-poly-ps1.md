# Format Module — Low-Poly / PS1-Era Animated

An ad that looks like a haunted demo disc from 1996. Blocky low-poly geometry,
warping affine textures, flat vertex lighting, dithering, fog, jagged aliased
edges, constant vertex jitter. The jank is the style, named explicitly in every
prompt. Two-phase gated inside this module: Director Sheet approval → prompts.

**Engine stack (locked — do not substitute):** anchor stills in **GPT Image 2,
High Quality only** → clips in **Seedance 2.0**, 15s max, **rendered at 480p or
720p, never 1080p/4K** (the low res sells the texture). Read
`references/model-specs.md` and `references/production-discipline.md` first.

---

## When this format fits the DNA
A "before" full of dread · a mechanism you can show as a system building around
the avatar · nostalgia / irony tolerance · a product that survives being rebuilt
as blocky geometry and stays recognizable.

---

## Production rules

1. **Engine stack is non-negotiable.** GPT Image 2 High for stills (Low/Medium
   clean up the crunch; Nanobanana and others "fix" the image). Seedance 2.0 for
   video (Kling / Veo hallucinate smoothness). Expect a few re-rolls before the
   motion lands — say so once so the user budgets credits.
2. **Clip math:** 15s hard cap. 30–37 spoken words max per 15s clip
   (~2–2.5 w/s). Count before locking; over 37 → split. Total VO words ÷ 33 ≈
   clip count.
3. **Restate the full Master Style block inside EVERY clip prompt** — Seedance has
   no cross-clip memory. Same for the Motion Constraint block.
4. **The Motion Constraint block ships with every clip** — without it Seedance
   defaults to buttery AI motion and the illusion collapses.
5. **Emotion → PS1 mechanic, literal over clever:**
   | Emotion | Visual |
   |---|---|
   | Pain / stress / heat | red vertex light + red fog, spiking geometry, harder texture warp, screen-shake, faster jitter |
   | Relief / calm | cool blue wash in, red draining, fog clearing, wobble settling, slow stiff glide |
   | Speed | hard cut, rigid dolly, judder, geometry snapping in |
   | Comfort / safety | warm vertex glow, a low-poly "room" building around the avatar, steady camera |
   | Proof / numbers | extruded 3D number meshes slamming in, faceted bar meters |
   | Money / value | spinning low-poly coins, price-tag mesh dropping, banded meter |
   | Dread / "before" | fog closing in, banded light flicker, fixed ominous angle, slow rigid push-in |
6. **No text in the render. Subtitles go on in post.** Every prompt says "no
   subtitles, no captions, no on-screen text, no logos, no readable signage" and
   the picture comes back clean, because a model asked for chunky low-res type
   returns warped, misspelled type. The finished ad's only text is the burned
   subtitle track, word-timed from the VO in the house spec, on by default
   (hard rule 23). A designed graphic the ad genuinely needs (a banner, an end
   card, a product label) is composited by `tools/assemble.mjs`, not generated.
7. **Camera fixed or rigid** (Alone in the Dark / early Resident Evil framing) or
   a slow stiff dolly. No gimbal, no bokeh, no motion blur. Transitions are hard
   cuts, vertex pops, glitch rolls, fog wipes.
8. **No real people or celebrities** — original characters of the same casting
   archetype only. Describe the character byte-for-byte identically in every
   anchor prompt; only pose/scene slots change.
9. **Pronunciation hardening for the AI voice:** never end a clip's line on a
   comma or conjunction — close on a full stop. Write "eleven thousand dollars",
   not "$11,000". Avoid hyphenated compounds. Respell brand names phonetically in
   the spoken script only ("Stridea" → "Stry-DEE-uh"); on-screen labels keep
   correct spelling.
10. **Product:** if a product image is uploaded, analyze it (shape, colours,
    label, proportions) and append the lock line every time it appears. No image
    → describe generically, skip the lock line.
11. **Continuity:** video-reference chaining (clip N as reference for clip N+1,
    prompt opens with the Extension Line) is the Seedance 2.0 default. Or
    last-frame chaining (end each clip on a settled near-static hold). Never write
    "open on the same frame as the previous clip" unless a chaining method is
    active.

## Negative constraints

Carry these in every clip prompt (they also live inside the verbatim blocks
below — this is the plain-language checklist):

```
if it moves smoothly it is wrong — no fluid or realistic animation, no easing, no
secondary motion, no motion blur; no modern clean CGI, no high-poly smooth models,
no anti-aliasing, no soft shadows or global illumination; no floaty gimbal or
handheld camera, no push-ins or orbits (camera is fixed or a slow rigid dolly);
no bokeh or depth-of-field blur; no full-sentence captions or subtitles (key words
only), no changing typefaces; no real people or celebrity likenesses; no rendered
brand logos (composited in post); render at 480p or 720p only, never 1080p/4K
```

## TWO-PHASE GATE (inside this module)

**Phase 1 — Director Sheet → wait for approval.** Deliver: chunked VO script with
per-clip word counts · clip map (CLIP 1: hook+problem · CLIP 2: mechanism · …) ·
per-clip beat plan (internal timecodes reset to 00:00, spoken line per beat, the
literal low-poly visual, the one on-screen keyword or none, camera, PROBLEM/RELIEF
lighting colour) · anchor-still manifest · product analysis (if image) · colour
logic (one PROBLEM colour, one RELIEF accent). Then STOP.

**Phase 2 — prompts, checkpoint first.** Anchor-still prompts first (user
confirms the stills hold the style). Then CLIP 1 alone as a checkpoint. Then the
remaining clips in a batch. Corrections carry forward silently.

(This is a sub-gate *within* Stage 4 — it does not replace the engine's Stage 3
approval, it adds a style check before spending Seedance credits on this format.)

## Verbatim blocks — paste exactly, adapt only the bracketed slots

### Master Style Prompt (inside every image prompt and every clip's style section)

```
Rendered in low-poly PS1-era 3D graphics, mid-1990s PlayStation aesthetic.
Chunky low-polygon geometry, stretched and warped low-resolution textures with
affine texture mapping distortion, visible vertex jitter, flat photographic
textures pasted onto rough 3D models in surreal collage style. Liminal,
weirdcore / dreamcore atmosphere with an eerie nostalgic mood. Flat ambient
lighting, muted vaporwave-adjacent color palette, no antialiasing, low
resolution, crunchy dithered textures, early 3D game screenshot look. Retro
pixelated blocky font for any text. VHS-tinged, lo-fi, uncanny.
```

For a warmer mood (comfort products), keep every technical clause and soften only
the atmosphere words — never remove the geometry/texture/lighting language.

### Motion Constraint Prompt (stack on top of every clip prompt)

```
Animate the character with stiff, robotic, low-poly PS1-era movement - NOT
smooth or fluid. Use choppy, low-framerate motion (around 10–15 fps) so the
animation looks jerky and stuttered rather than seamless. Keep the joints rigid
and mechanical - limbs swing from fixed pivot points with no secondary motion,
no weight, no easing; movements snap between poses. Add the classic PS1 vertex
jitter / wobble - the geometry shakes and warps slightly as it moves because of
low-precision vertex calculations. Textures swim and warp across the surfaces as
the model turns (affine texture distortion in motion). The character animates in
a few stiff keyframes with visible popping between poses, like a mid-90s
PlayStation or Sega Saturn character. Prioritize crude, mechanical, low-framerate
motion over realistic fluid animation - if it moves smoothly, it's wrong.
```

Settings to state with every clip batch: **Seedance 2.0 · 15 seconds · 480p or
720p (never 1080p/4K) · 9:16.**

### Extension Line (video-reference chaining — opens clip 2+)

```
Extension of the reference video, starts from the same moment. Continue the same
15-second vertical (9:16) video ad in an unbroken low-poly PS1-era 3D graphics
aesthetic. All visuals remain in the same scene, same character, same style.
```

### Anchor still prompt (GPT Image 2 High Quality, scratch path)

```
[Full scene: environment, original character (never a real person, byte-for-byte
identical wording every anchor), product placement + lock line if a product image
was uploaded, pose, camera angle, the PROBLEM or RELIEF lighting colour for this
beat.] [Master Style Prompt, verbatim.]
```

Product lock line (only if a product image was uploaded):
```
Make sure the product is a faithful low-poly 3D model of the uploaded reference —
same silhouette, colours, label, and proportions, rebuilt as blocky PS1-era
geometry with the label baked into a low-res affine-mapped texture.
```

### Complex clip prompt (one block per 15s clip)

```
CLIP [N] of [TOTAL] (15s, 480p/720p, 9:16). [Extension Line if chaining.] Create
a low-poly PlayStation-1-era 3D animation: blocky faceted models from large
visible triangles with hard edges; low-resolution muddy textures, affine-mapped
so they visibly warp and swim across surfaces; flat Gouraud vertex lighting, no
real shadows; a limited palette with heavy dithering and colour banding; thick
fog hiding a short draw distance with geometry popping in; low internal
resolution, jagged aliased edges, zero anti-aliasing. Motion is the signature:
constant vertex jitter/wobble, stiff low-framerate keyframed animation that pops
between poses, warping textures. Camera is fixed/rigid or a slow stiff dolly,
Alone in the Dark / early Resident Evil framing. Lighting/fog colour logic:
[PROBLEM COLOUR] for the pain, [RELIEF ACCENT] for the payoff. No on-screen
text of any kind in the render, no subtitles, no captions, no readable signage;
the voice-over carries the script and the subtitles burn in post. One blocky aliased low-res font, consistent every
shot. [Product lock line if the product appears.] Fast, cut-driven, no
talking-head footage, only low-poly 3D shots.

00:00–00:03 — "[spoken line, verbatim, ends on a full stop]" — [literal low-poly
shot showing the feeling: geometry behaviour, texture-warp intensity, jitter
level, lighting/fog colour, camera move]. On-screen keyword: [WORD or none].
00:03–00:07 — "[line]" — [shot]. Keyword: [WORD or none].
[continue to ~15s]

Style: low-poly PS1-era 3D, big flat triangles, warping affine textures, flat
vertex lighting, dithering and banding, fog, jagged aliased edges, constant
vertex jitter/wobble, stiff low-framerate motion, fixed/rigid camera. On-screen
text stays to short key words only. One blocky aliased font, consistent
throughout. Motion explanatory not decorative, authentically janky, never clean
modern CGI. Every visual matches the spoken line. Haunted early-3D demo-disc
feel centred on [core emotional throughline].

[Master Style Prompt, verbatim.]
[Motion Constraint Prompt, verbatim.]
```

## Assembly notes
Generate the VO first, extract its timestamp timeline, split into 15s windows,
paste each into its clip. Anchor stills → confirm style → Clip 1 checkpoint →
batch the rest. Chain via video-reference (feed clip N's output as the reference
for clip N+1). If Seedance mangles the VO, run the ElevenLabs repair path; keep
the original music/SFX, lay the clean VO over it, optional bit-crush to match the
degraded visuals. Assemble with `tools/assemble.mjs` (the skill does the edit).
