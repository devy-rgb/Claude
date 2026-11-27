# Format Module — Raw UGC Yapper / Selfie Rant

One person, phone at arm's length, talking straight to camera like a friend who
just discovered something. Lowest production signal, highest authenticity signal.
Raw, fast, a little messy.

**Engine stack:** Seedance 2.0 (pure natural-language prose, image reference for
the speaker, native dual-channel audio). Read `references/model-specs.md`
(Seedance section) and `references/production-discipline.md` first.

> **This is an avatar-led ad.** The two locked defaults in
> `references/formats/talking-head.md` → "AVATAR-LED AD DEFAULTS" apply here too:
> the on-camera **avatar clip** (5–15s) uses **`seedance-2.0-image-to-video`**
> (the full model, not `-fast-`), and the voice is a **Chatterbox clone of the
> avatar's own generated voice**, reused for all B-roll VO. Override only if the
> user explicitly asks for another model/voice.
>
> **On Adsora Gen** the long-form rule in `references/talking-head-long-form.md`
> applies here too: a short rant is one `t2v` / `i2v` clip with H3's native voice;
> a full read is a **chain of `i2v` clips** seeded from a settled closed-lip
> portrait, one seed throughout — never `avatar` with a muxed track for a long read.

---

## When this format fits the DNA
Raw emotional pain / relief · relatability and trust · a personal-result story ·
a "you won't believe this" energy. If the competitor ad is itself a selfie
testimonial, this is the 1:1 rebuild.

---

## Production rules

1. **Prose only.** Seedance prompts are one flowing present-tense paragraph. No
   section headers, no bracket tags, no separate negative field.
2. **Pick a capture mode** from the script's energy:
   - *Selfie handheld* — personal confession, GRWM, venting. Front cam, arm's
     length, micro-wrist drift.
   - *Tripod static* — calmer review/testimonial. Phone propped, subject drifts.
   - *Walk-and-talk* — high-energy rant. Front cam while walking, footstep bounce.
3. **Character anchor once**, before the clips: a plain-English note (age,
   ethnicity, hair, eyes, build, outfit, energy) + a voice line (accent — American by default, tone,
   pace). Tell the user which image slot to fill (`@Image 1` = speaker;
   `@Image 2` = face close-up if they have one; `@Image 3` = product, only in
   clips that show it).
4. **Reuse the exact same reference pack** across every clip — that's what keeps
   the speaker consistent.
5. **Preserve the script verbatim** in the spoken lines: filler words, CAPS
   emphasis, ellipses, intentional fragments — all stay. Never paraphrase.
6. **Segment every ~40–45 spoken words (~15s).** Never cut mid-sentence. Each
   segment is one prompt block, under 2000 characters — count it and show the
   count.
7. **Every sentence describes change over time.** If a sentence could caption a
   still photo, rewrite it as motion.
8. **One camera move per block.** Name it exactly ("slight micro-jerks from wrist
   fatigue", "footstep bounce"), never "cinematic".
9. **Sound is part of the scene, not a list:** room tone, mic character,
   "no background music". Describe it inline.
10. **Product** only referenced in blocks where it's on screen; held in hand,
    label locked from `@Image 3` or composited in post.
11. **One genuine emotional beat** per rant — frustration, disbelief, relief,
    half-laughing at themselves. Tie it to a specific line.

## Negative constraints (as an inline `constraints:` clause, per block)

```
constraints: no readable on-screen text, no captions, no subtitles, no logos,
no watermarks, no extra people in frame, no phone or second camera visible in
frame, no morphing hands or extra fingers, preserve the speaker's identity and
wardrobe, keep the background unchanged, product label stays readable and
unwarped, no beauty filter, no skin smoothing, no cinematic colour grade, mouth
motion matches the spoken words, no doubled or echoed audio.
```

## Paste-ready skeletons

### Character reference note (once, above the clips — NOT a Seedance prompt)

```
━━━━━━━━━━━━━━━━━━━━━━
CHARACTER REFERENCE (for all clips)
━━━━━━━━━━━━━━━━━━━━━━
Speaker: [age] [ethnicity] [gender], [hair length/texture/style], [eyes],
[build], wearing [top], [makeup / none], [energy in 3–4 words].
Voice: [accent] cadence, [tone], [pace] — e.g. "American West-Coast millennial,
venting-to-a-friend, fast with deliberate pauses".

// Attach the speaker photo as @Image 1 in every clip.
// Attach a face close-up as @Image 2 if available.
// [Only in product clips] Attach the product photo as @Image 3.
━━━━━━━━━━━━━━━━━━━━━━
```

### Clip block (Seedance 2.0 prose, ≤2000 chars)

```
━━━━━━━━━━━━━━━━━━━━━━
CLIP 1 — 15s | selfie handheld | ~[N]/2000 chars
━━━━━━━━━━━━━━━━━━━━━━
The [person] from @Image 1 films herself in [specific real room — 2 named
objects], holding her phone at arm's length in one hand, front camera, slight
micro-jerks from wrist fatigue. She leans into the lens as she starts, free hand
already mid-gesture. As the first idea lands she [specific motion tied to the
line — eyes widen, a quick air-slice, a headshake]. She softens on the second
idea, leaning back a little, gesturing smaller. Close-mic front-camera
compression, faint [room ambience], slight [echo], no music. She says in a
[accent], [tone] voice, like venting to a friend on a call: "[exact lines for
this segment, verbatim from 03-rebuild.md, CAPS and ellipses preserved]". Raw
phone footage, TikTok confessional energy, no-filter realism. Vertical 9:16.
constraints: [the negative clause above].
```

### Product-beat block (adds the product)

Same structure, add: `She turns the [product] label toward the lens in her free
hand, holding it still for a beat — the label matches @Image 3 exactly, text and
colours unchanged, no warping.` Keep `@Image 3` referenced only here.

## Assembly notes
No stills to pre-generate — Seedance works from the reference pack. Generate clips
in order; for continuity, pass clip N as `@Video 1` into clip N+1 and open that
block with: *"Continuation of the previous clip, same speaker, same room, same
framing, picking up mid-thought."* Draft at 480p, finalize the winners at 720p.
Burn centered captions in post for muted viewing. If Seedance mangles the VO,
run the ElevenLabs repair path (see `references/model-specs.md`).

---

# HOUSE WORKFLOW — Yapping talking head (Omni + green screen)

Full worked example: `references/house-workflows/yapping-talking-head.md`. Also
read `references/house-playbook.md`. This is an alternative build to the Seedance
yapper above — same format, different engine and background approach.

## What differs
- **Engine: Nanobanana Pro still → Google Omni** (native lip-synced voice from
  the dialogue in each clip prompt; no separate VO track). Omni caps at ~10s,
  ~20–25 words per 10s clip.
- **Green screen background.** The subject stands against a seamless chroma-key
  green backdrop (`#00B140`), flat and evenly lit, filling the frame edge to
  edge — zero gradient, zero vignette, no shadows on the backdrop, no seams/
  wrinkles, no room visible. The user keys it out and drops in their own
  background + any title card in the edit.
- **One reference image, reused as the start frame for EVERY clip** (not a unique
  start frame per clip). Expect a small visual "snap back" to the same starting
  pose at each cut — invisible once you cut fast between clips.
- **Pose matched to the source video**: e.g. extreme low-angle close-up (camera
  below chin, ~25 degrees up), leaning into the lens, one hand raised near the
  eyebrow mid-gesture. Then **choreograph that hand per beat** — in each clip it
  does something specific (lowers out of frame, unfurls fingers to count a list,
  points at the lens, opens to a palm). That ties the reused start pose into
  motivated motion.
- **Locked Blocks pasted verbatim** every clip: a Style Lock (green screen +
  photoreal skin + deep focus + no on-screen text) and a Voice Lock (accent +
  pace + mic character), accent locked word-for-word.
- **Notes-app title card** as a separate flat graphic (iOS Notes screenshot
  style — plain white, black SF-style sans-serif, numbered list, no phone bezel,
  no status bar). Composited behind the keyed subject. AI text rendering is
  unreliable for a full list → typeset it as flat HTML/CSS for pixel-perfect
  text instead. Make sure the card text doesn't sit where the subject's head
  covers it for the whole clip.

## Reconstructing a source video with no transcript
Extract frames with ffmpeg (one per second). To read static on-screen text that a
moving subject keeps covering, take a **median-stack composite across all frames**
— the moving subject averages out and the static list/title underneath becomes
readable. Read burned captions frame by frame the same way. Then write a
**condensed rewrite** (~30s from a 95s source) that matches the format, structure
and energy in original wording — never a verbatim clone.
