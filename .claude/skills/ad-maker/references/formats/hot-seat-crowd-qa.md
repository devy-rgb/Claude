# Format Module — Hot Seat / Crowd Q&A (live-event social proof)

Repurposed live-event footage: a crowd member stands with a mic and states a
specific result or problem, and a coach on stage answers with a short, tactical,
quotable line. Karaoke captions, jump cuts on each phrase, roomy live-mic audio,
zero polish. Specificity sells harder than production value.

**Engine stack:** Nanobanana Pro character anchors → Google Omni (16-block
briefs, native audio, ~10s cap). Read `references/house-playbook.md` and the full
worked example in `references/house-workflows/hot-seat-crowd-qa.md` first.

---

## When this format fits the DNA
Bandwagon / crowd validation **and** founder-objection / proof (a real checkable
number crushing skepticism). The crowd member raises the objection; the coach
never hedges. If the competitor ad is event footage, a "hot seat", or any
crowd-asks / expert-answers structure, this is the rebuild.

---

## Production rules

1. **Two anchors, two backgrounds.** Crowd member (standing among seated
   attendees, mic on a stand in front of them) and coach (on a small stage
   against a branded step-and-repeat backdrop). Generate each from Nanobanana
   matching the pose/background of a reference screenshot but with a **fresh
   fictional face** — "this is a different, fictional person — do not reproduce
   the real individual's likeness from the reference."
3. **A third anchor for the coach's silent listening cutaway** — a full-body
   frame, arms at sides; the clip prompt directs him to cross his arms and nod.
4. **GAZE LOCK on the coach**, every clip: eyeline fixed in the exact direction/
   angle of his anchor — "looking slightly off toward the unseen crowd, not at
   the camera — for the entire clip. The direction of his gaze never changes from
   the reference frame." Also in the negatives ("no gaze drift, no looking at the
   camera, no eyes wandering").
5. **OPENING FRAME LOCK on re-used crowd shots** (the short follow-up / close
   clips): "the very first frame must match @image1 exactly — same pose, same
   gesture, same body angle, same framing. Do not 'settle into' a different
   starting pose."
6. **Static-background instruction on re-used shots**: "seated attendees stay
   exactly as positioned in @image1 for the entire clip — same poses, no
   independent movement, no shifting, no new gestures. Static background, not
   performing." Add to negatives.
7. **Camera fully locked off** every clip — "zero movement and zero drift,
   tripod-still, filmed from a seated position, slight low angle."
8. **Coach delivery**: calm, composed, cool authority. "Confidence comes from
   stillness, not intensity." Small unhurried gestures continuing from the
   raised-hand pose in his anchor.
9. **Crowd member emotional arc across his clips**: nervy pride (hook) →
   frustration (problem) → genuine curiosity (follow-up) → quiet realisation
   (close). Name the shift per clip. "The opposite energy of the hook line's
   nervous pace" by the end.
10. **Specificity over polish** in the script: real dollar figures, operational
    detail. Numbers **spoken as words** in dialogue ("fourteen thousand
    dollars"); the burned caption uses "$14K IN 90 DAYS".
11. **Silent listening cutaway clip**: `VOICE: N/A — silent clip.` `DIALOGUE: No
    dialogue. Mouth stays closed and still for the entire [N] seconds. No lip
    movement, no mouthing.` `AUDIO: Completely silent — no voice, no room tone,
    no music. Generate with no native audio track regardless.` Performance: arms
    rise and cross once in the first half-second, then hold; 2–3 slow small nods;
    "no uncrossing the arms after crossing." Insert it over the other speaker's
    line in the edit.
12. **Voice per character verbatim** every clip (crowd member: young, regional;
    coach: calm measured, different region).
13. **The edit = cut + caption + end card only, and the skill does it**
    (`tools/assemble.mjs`). End card is text-only, no VO,
    comment-bait ("Comment 'X' for how it works"). Captions: bold sans-serif,
    karaoke word-highlight, centered lower-third, 2–4 words at a time.

## Negative constraints (pool — 4–8 targeted per clip)

```
no subtitles, no captions, no on-screen text, no logos or text beyond the
invented "[BRAND]" on the badge/backdrop, no watermarks, no VFX, no CGI, no 3D,
no cartoon, no beauty filter, no skin smoothing, no HDR, no colour grade, no
sharpening, no face morphing, no identity drift, no wardrobe changes, no second
person near the microphone, no gaze drift, no looking at the camera, no eyes
wandering, no background attendee movement or new reactions, no uncrossing the
arms after crossing (silent cutaway), no talking or lip movement (silent
cutaway), no camera movement of any kind, no extra fingers, no warped hands, no
flicker, no jitter
```

## Paste-ready skeletons

### Still — crowd member anchor (@image1, Nanobanana Pro)

```
Hyper realistic candid event-recording phone shot ONLY (no bokeh, no portrait
mode):
Match the background, room, and camera composition of the referenced photo, but
this is a different, fictional person — do not reproduce the real individual's
face or likeness from the reference image.
A [age] person standing up among seated conference attendees, caught mid-sentence
speaking into a standalone chrome microphone on a stand in front of them at chest
height. No other person holding or touching the mic. [Skin, hair, build,
features — real-but-magnetic, not a model face]. Weight on one leg, one hand
gesturing open-palm at chest height, the other holding a folded event program at
his side. [Wardrobe], a lanyard with a badge reading "[BRAND]" in small clean
sans-serif. Real conference room background: [wall colour], rows of seated
attendees slightly out of focus behind him, [a water bottle on the floor].
Filmed handheld from a few rows back at chest height, vertical framing slightly
off-centre, mild digital zoom softness, faint handheld tilt. Candid mobile camera
quality, natural colour, mild compression, slight sharpening. Deep focus, no
artificial blur, background attendees readable not blurred. Even cool fluorescent
room light ~4500K, flat and shadowless.
No bokeh, no portrait mode, no studio lighting, no ring light, no beauty filter,
no glamour retouch, no second person near the microphone, no on-screen text or
caption overlays baked into the image, no real company logos other than the
invented "[BRAND]" badge text. No phone visible anywhere in frame.
```

### Still — coach anchor, speaking (@image2)

Same opener + "different fictional person" line. `A [age] person on a small stage
mid-explanation, caught mid-gesture with a hand open mid-count.` [Features],
[wardrobe with a small chest logo "[BRAND]"], weight on the back foot, torso
turned slightly toward an unseen crowd, mouth open mid-word. `Real stage
background: a [dark] textured step-and-repeat backdrop with a repeating abstract
mark and the bold wordmark "[BRAND]", a stage riser edge, a water bottle at his
feet.` Filmed handheld from the audience at a slight low angle. Ambient stage
wash, cool-toned gel mixed with warm spot fill. Same negatives.

### Still — coach silent-listening anchor (@image3)

A real generated full-body frame of the coach on stage, arms at his sides. Used
only for the silent cutaway clip.

### Clip — crowd member, hook (Omni 16-block)

```
FORMAT: Create a 6-second vertical 9:16 realistic UGC video.
QUALITY / FIDELITY LOCK: Use the exact lighting, texture, and phone image quality
as @image1. No sharpen, no skin enhance, no beauty filter, no smoothing, no HDR,
no polish, no clarity, no colour grade. Raw, true to the reference, same even
ambient room light and natural handheld phone texture.
IDENTITY LOCK: Use @image1 as the exact identity and scene reference for the
[person]. Preserve his facial structure, [skin], [hair], [stubble], likeness
exactly.
OUTFIT LOCK: [every garment + the lanyard/badge reading "[BRAND]" + watch + the
folded pamphlet at his side]. Do not change outfit.
ENVIRONMENT LOCK: Freeze everything visible in @image1: [wall], rows of seated
attendees softly out of focus behind him, a standalone black microphone on a
stand directly in front of him at chest height with no one else touching it.
SCENE DESCRIPTION: Indoor conference room, daytime, even ambient light, the
ordinary energy of a live business event.
BACKGROUND OBJECTS: Seated attendees stay in soft midground focus, dressed
uniformly, mildly reactive but not performing.
CAMERA: Static handheld phone perspective, vertical 9:16, camera completely still
with zero movement and zero drift, tripod-still throughout, filmed from a seated
position a few rows back, slight low angle looking up toward him, chest-to-thigh
framing matching @image1. No cuts, no zooms, no whip pans, no handheld drift.
CAMERA REVEAL BEAT: None. Static framing throughout.
PERFORMANCE VIBE + ACTION: Earnest, slightly wound-up — proud of a real win but
visibly stressed about the problem underneath it. From the open-palm gesture in
the reference, the hand continues naturally as he talks, weight shifting slightly.
Creator: "[first line — a specific result]" — chin lifts slightly with quiet
pride, open hand gestures forward on the number.
Creator: "[the number, spoken as words]" — brief pause before it, small emphatic
nod, eyes flick toward the mic.
VOICE: [Young] [regional] male voice, [accent], clear and conversational,
slightly quick pacing like he's nervous holding a mic in front of a room.
DIALOGUE: He says exactly, with accurate lip sync and natural pacing: "[both
lines, numbers as words]"
TIMING / PERFORMANCE BEAT: One continuous breath with a half-second beat before
the number, filling the full 6 seconds. No camera movement.
AUDIO / ENVIRONMENT SOUND: Realistic phone-mic audio, roomy conference-hall
acoustics, faint background murmur, occasional distant chair shift. Voice close
and slightly reverberant, not studio-polished. No music.
STYLE: Authentic event-recording UGC, raw handheld phone footage, natural skin
texture, slightly imperfect realism.
NEGATIVE CONSTRAINTS: [pool above].
```

### Clip — coach answer (Omni 16-block, adds GAZE LOCK)

Same shape against `@image2`. Insert a **GAZE LOCK** block after IDENTITY LOCK
(wording in Production Rules §4). Performance from the raised-hand pose, "movements
small and unhurried", "confidence comes from stillness". Voice: calm measured
[region] accent.

### Clip — coach silent listening cutaway (Omni, against @image3)

Same shape; `GAZE LOCK` to @image3; `VOICE: N/A — silent clip.` `DIALOGUE: No
dialogue. Mouth stays closed and still for the entire [N] seconds.` `AUDIO:
Completely silent clip: no voice, no speech, no room tone, no music. Generate
with no native audio track regardless.` Performance: "arms rise and cross once in
the first half-second, deliberate and unhurried, then hold for the rest; weight
settles evenly; 2–3 very slight slow nods; no other gesturing, no uncrossing."

## Assembly notes
Generate the three anchors first. Then clips in cut order, alternating crowd/coach.
Insert the silent listening cutaway over the crowd member's problem line (mute its
track). Hard cuts only. Karaoke captions from the assembly pass, 2–4 words at a
time. End on a text-only comment-bait card.
