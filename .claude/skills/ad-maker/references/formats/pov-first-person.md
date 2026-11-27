# Format Module — POV / First-Person Scene

The whole ad is shot from the viewer's own eyes. A character enters *your* space
(a hospital room, your side of a desk, a chair next to you), leans in, and talks
directly to "you". Feels intercepted, not broadcast.

**Engine stack:** Nanobanana Pro start/end still frames → Google Omni (native
audio, ~10s cap per clip, first/last-frame interpolation available). Read
`references/house-playbook.md` and the full worked example in
`references/house-workflows/pov-first-person-scene.md` first.

---

## When this format fits the DNA
Industry-contrarian / "declassify the secret" (DISRUPT) · a confession or a
warning · a mechanism the viewer needs told to them privately · trust built by
proximity and eye contact rather than credentials. If the competitor ad speaks
straight to "you" and creates a sense of being let in on something, this is the
1:1 rebuild.

---

## Production rules

1. **The camera IS the viewer's eyes.** Static, fixed eye-level (or reclined)
   viewpoint low in the frame. Only natural micro-movement consistent with the
   viewer's head/gaze tracking the character — never a dolly, pan, or zoom. The
   character grows larger as they approach and smaller as they leave; the camera
   never moves to follow.
2. **Character speaks to the lens** with warm intensity — "you", never "people".
   Eyes locked on camera for the direct beats.
3. **First appearance = start frame is the anchor** (full describe, no lock).
   The **end frame carries a CHARACTER LOCK** back to it and is reused as the
   character/environment reference for every later clip.
4. **The entrance clip uses first/last-frame interpolation**: "@image1 shows
   [entry pose], @image2 shows [arrived-at-bedside pose], this clip is the
   continuous motion connecting those two moments." Add a CAMERA / MOTION PATH
   block describing the journey as the viewer's eyes tracking them.
5. **Match the Omni prompt to the ACTUAL generated stills**, not to what you
   intended — if the still rendered a monitor reading "109" and the character's
   back turned, the prompt says exactly that.
6. **Fully locked-off camera** in every non-entrance clip (see house-playbook §3).
7. **Voice lock verbatim** every clip (accent + delivery descriptor).
8. **Frame-chain**: each clip's final frame is the next clip's start/reference
   frame. Restate every lock — Omni has no memory.
9. **Product** originates from an **off-frame surface** the character reaches to,
   never from their own body/pocket. Load the product image as a Visual
   Reference; PRODUCT LOCK on the label.
10. **The exit beat is the reverse of the entrance**: character turns, walks
    toward the (closed, silent) door/exit, grows smaller in the static frame,
    clip ends before they reach it.
11. **Wardrobe stays conservative and role-appropriate** (standard-issue, not
    tight/altered) even when the beauty dial is high.
12. **No disclaimer** (hard rule 14): `"disclosure": false` in `assemble.json`,
    no lower-third legal line on any clip. On-screen captions are added by the
    assembly pass.

## Negative constraints (pool — 4–8 targeted per clip)

```
no subtitles, no captions, no on-screen text, no logos, no watermarks, no VFX,
no CGI look, no 3D, no cartoon, no beauty filter, no skin smoothing, no HDR, no
cinematic colour grade, no artificial sharpening, no face morphing, no identity
drift, no wardrobe changes, no badge/stethoscope/watch/mic disappearing, no extra
people entering the room, no jump cut between the two reference frames, no
unrequested camera movement beyond the described character motion, no flicker, no
jitter, no warped hands, no extra fingers, no product label drift or warping, no
product spinning, no second object in her other hand, no reaching motion that
looks like it comes from her own body or pocket, the door does not open/move/
creak/change in any way, no cut to black
```

## Paste-ready skeletons

### Still — Clip 1 START frame (NEW anchor, Nanobanana Pro)

```
Hyper realistic candid POV shot, eye-level from [the viewer's viewpoint — e.g.
"reclined in a hospital bed"] (no bokeh, no portrait mode, no selfie, no phone
anywhere in frame):
[The space seen from that viewpoint. A doorway/entry to one side.] A [role —
e.g. nurse] [enters mid-stride / is mid-action], caught mid-motion rather than
posed. She is [age, build], [hair with a located detail], [2–3 features], [Dial-A
beauty vocabulary]. [Role-appropriate conservative wardrobe, every piece named],
[props: badge / stethoscope / lanyard]. [Real environment details: 2–3 named
objects with position, a wall-mounted [monitor], the light source and rough
temperature — even and [cool/warm]]. Slightly [low/reclined] viewing angle
consistent with [the viewer's position], mild natural framing imperfection, not
centred. Candid mobile camera quality, natural colour, mild compression, slight
sharpening. Deep focus, no artificial blur. No beauty-filter smoothing beyond
what's described, no studio lighting, no portrait mode, no bokeh, no revealing or
altered wardrobe, no phone visible anywhere in frame, no phone on any surface.
```

### Still — Clip 1 END frame (LOCK to start, "arrived, about to speak")

```
📌 Before generating — load in Nanobanana Pro:
→ Character lock: the Clip 1 start frame, set as Character Reference
→ Environment reference: the Clip 1 start frame, set as Visual Reference

Hyper realistic candid POV shot, eye-level from [the viewer's viewpoint] (no
bokeh, no portrait mode, no selfie, no phone anywhere in frame):
CHARACTER LOCK — this is the same [role] as the reference image, same room, same
everything. Same face: [jaw and cheekbone structure], [skin], [makeup], [lip].
Same [hair + detail]. Same [wardrobe — every piece]. Same [props]. Same room:
same [monitor], same [objects], same lighting. Do not change any of these.
She has now crossed the room and is [right beside the viewer, leaning in close],
her upper body and face filling most of the frame. [Hand has just done X and is
now dropping to Y.] Expression shifted to something private and direct, lips
barely parted as if a half-second from speaking, eyes locked on the lens with
warm intensity. Very slight motion blur consistent with the tail end of the
walk just settling. Same lighting, slightly warmer falloff now that she's close.
Candid mobile camera quality, natural colour, mild compression, slight
sharpening. Deep focus, no artificial blur. [Same negatives as the start frame.]
```

### Clip 1 — entrance + hook (Omni, first/last-frame interpolation)

```
FORMAT: Create an 8-second vertical 9:16 realistic UGC video using first/last
frame interpolation between two supplied keyframes.

QUALITY / FIDELITY LOCK: Use the exact same lighting, texture, and image quality
as both reference images. No sharpen, no skin enhance, no beauty filter, no
smoothing, no HDR, no cinematic polish, no clarity boost, no colour grade. Raw,
organic, true to the references — same [cool fluorescent hospital] lighting,
same natural skin sheen, same imperfect realism.

IDENTITY LOCK: @image1 (first frame) and @image2 (last frame) show the exact same
[role] — [hair], [skin], [features]. Preserve her face, hair, and build exactly
and consistently across the whole clip. No identity drift between the two frames.

OUTFIT LOCK: [every garment + every accessory]. Do not change, remove, or add to
any of these at any point.

ENVIRONMENT LOCK: Same [room] as both references: [every object with position,
the wall monitor reading "___", the whiteboard/sign, the light panel, the door
onto a hallway with X and Y visible]. Environment stays fully consistent
throughout.

SCENE DESCRIPTION: @image1 shows [her entry pose — back to camera, hand on the
door, just stepped in]. @image2 shows [her arrived pose — leaned in close over
the tray table, hand on the edge, looking at the viewer mid-sentence]. This clip
is the continuous motion connecting those two moments.

BACKGROUND OBJECTS: [The monitor, whiteboard, tray table, IV poles] remain
visible and stable throughout. The hallway and its fixtures are visible through
the doorway in @image1 and disappear from view once the door is closed.

CAMERA: Static POV — the camera is literally the viewer's own eyes, [reclined in
the bed]. Fixed eye-level viewpoint low in the frame, matching both reference
images exactly. Only natural micro-movement consistent with a head/gaze tracking
her across the room — no dolly, no pan, no zoom, no cinematic movement. One
continuous shot from @image1 to @image2, no jump cuts.

CAMERA / MOTION PATH: From @image1's exact pose she [reaches back, pushes the
door closed — hallway view disappearing as it shuts], turns to face the [bed],
crosses the room in a few purposeful strides passing the [monitor and whiteboard]
on her left, and arrives at [the tray table], leaning down into it to close the
distance — settling into @image2's exact close, leaned-in composition with her
hand on the [table edge].

PERFORMANCE VIBE: Hushed conspiratorial urgency — like she's about to break
protocol to help you. Warm, focused, one glance back after the door clicks shut,
but clearly audible and enunciated, never a breathy under-the-breath whisper.

PERFORMANCE / ACTION: She closes the door, glances back to confirm it's shut,
then locks onto the viewer's eyes as she crosses. No dialogue during the walk.
As she arrives and leans in she starts speaking right as she settles.
[Role]: "[hook line from 03-rebuild.md]" — delivered right as she leans into the
@image2 pose, hand landing on the edge, eyes on camera, timed so the last words
land close to the final frame with her lips mid-word, matching @image2.

VOICE: [Age] woman with a [specific regional accent — e.g. warm genuine Southern
American, soft vowel drawl, low-mid register]. Hushed with urgency but clearly
enunciated for clean lip sync, not breathy, not exaggerated. This exact voice
description carries forward unchanged in every subsequent clip.

DIALOGUE: She says exactly, with accurate lip sync and natural pacing:
"[hook line]"

TIMING / PERFORMANCE BEAT: @image1 pose → pushes the door shut → turns → crosses
in a few quick strides → arrives → leans into @image2's pose → begins the line as
she settles, landing on the last words right at the final frame.

AUDIO / ENVIRONMENT SOUND: Realistic [hospital] room tone: [a soft steady monitor
beep, faint hallway murmur/footsteps that cut off once the door shuts, a low
fluorescent/HVAC hum]. Her voice close and present in the room, not phone-mic,
not studio-polished. No music.

STYLE: Authentic [hospital]-POV UGC. Raw, unpolished realism. Real [fluorescent]
lighting texture, believable candid moment.

NEGATIVE CONSTRAINTS: [pool above, tuned to this clip].
```

### Clips 2–N — continuation (Omni, standard 16-block, no interpolation)

`@image1 = the previous clip's final frame.` Restate QUALITY/IDENTITY/OUTFIT/
ENVIRONMENT LOCK verbatim, "SCENE DESCRIPTION: continues directly from where the
last clip ended — she's still [pose], mid-conversation." Static POV camera. Voice
block verbatim. One dialogue line + per-line em-dash performance beats. For the
product-reveal clip add PRODUCT REFERENCE + the off-frame-surface reach. For the
exit clip: the reverse-approach walk toward the closed silent door.

## Assembly notes
Generate: Clip 1 start → Clip 1 end (LOCK) → then frame-chain each clip's final
frame forward as the next clip's reference. The entrance is the only
interpolation clip. No disclosure lower-third (hard rule 14); add script
captions with `tools/assemble.mjs`; hard cuts between clips.
