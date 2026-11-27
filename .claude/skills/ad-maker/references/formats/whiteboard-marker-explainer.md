# Format Module — Whiteboard / Marker Explainer

A short vertical explainer told inside one hand-drawn board universe. Everything
is drawn on the board, appearing stroke by stroke as if drawn live. Simple
figures, icons, arrows, short hand-lettered labels. Deliberately hand-made — the
wobble of a real hand, not a clean vector reveal.

**Two production modes** (pick one at Stage 4):

| Mode | Who's on screen | Audio | Engine | Full worked example |
|---|---|---|---|---|
| **Visible actor** (default) | a person stands at the board and writes while talking | native lip-synced dialogue | GPT Image 2 stills → **Seedance 2.5** video | `references/house-workflows/talking-whiteboard-actor.md` |
| **Hand-only** | just a hand + marker, or no hand | off-camera voiceover, not lip-synced | image model stills → Seedance 2.5 (or Omni) | `references/house-workflows/blackboard-chalk-hand-only.md` |
| **Pixar pointer** (variant) | a chibi-3D presenter points a stick, content appears | native lip-synced dialogue | image model → Seedance 2.5 | `references/house-workflows/pixar-whiteboard-pointer.md` |

Read `references/house-playbook.md` (esp. §6 whiteboard row) and
`references/production-discipline.md` first. The **House workflow** section at the
foot of this file is the operator's real, debugged process — follow it over the
quick scaffold when the ad matters.

---

## When this format fits the DNA
A mechanism that needs *explaining* (invisible processes: how a fee compounds,
how the gut works, how a system routes something) · a "the real problem isn't X,
it's Y" reframe you can draw as a diagram · a calm, teacherly authority tone ·
proof that's a number or a simple before/after you can box and circle.

Two board variants:
- **Whiteboard** — white surface, black marker base + ONE accent colour + red
  reserved for the problem. Bright, clean, corporate-explainer feel.
- **Blackboard** — dark green or black surface, white chalk base + ONE pale
  accent. Warmer, "lecture hall / hand-taught" feel. Chalk dust, softer edges.

Pick one and hold it for the whole ad.

---

## Production rules

1. **One board, one universe.** Every beat is a new region of the same board (or
   a wipe to a fresh board). Never leave the board.
2. **One idea + one drawn action per clip.** A clip draws ONE thing: one diagram,
   one figure, one arrow-and-label, one number circled. Two things = two clips.
3. **Word budget: 18–24 spoken words per 10s clip, hard max.** Count per clip.
   Read the whole VO aloud as one continuous lesson before generating.
4. **The signature motion is the DRAW-ON.** Marker/chalk strokes appear
   progressively, in the stutter and slight overshoot of a real hand — start
   points, small wobble, ink/chalk catching unevenly. Never a smooth
   left-to-right vector wipe. State this every clip. Optional visible drawing hand
   (see §Character).
5. **Transitions are ERASE / WIPE.** A hand with an eraser sweeps the region
   clear, or a squeegee wipe reveals the next board. Hard cuts allowed but the
   erase-wipe is the format's signature seam. One transition per clip, max.
6. **Board text is diegetic, and it is the one text this format generates.**
   She is drawing, so the marker lettering is part of the picture rather than a
   caption layer, and it stays. Subtitles still burn from the VO in post on top
   of it, on by default (hard rule 23), so the board must stay SHORT or the two
   collide. The board carries the *skeleton of the argument*, never the spoken
   sentence:
   - the mechanism name, hand-lettered and boxed ("THE FEE LOOP")
   - one number, circled ("-31%")
   - 2–4 word labels on arrows ("more calls", "wasted spend")
   - a before → after with an arrow
   No full sentences. No subtitles. State in the prompt: "hand-lettered marker
   text only, short labels, no full-sentence captions, no typeset font."
7. **Colour discipline.** Whiteboard: black base + ONE accent (the solution) +
   red (the problem only). Blackboard: white chalk + ONE pale accent. Never more
   than three colours on the board at once. The accent colour = the product's
   move; the problem stays in red/plain.
8. **Figures are simple.** Stick figures or minimal rounded-blob people, simple
   object icons (a clock, a coin, a bottle outline, a funnel, boxes-and-arrows).
   No detailed illustration. Consistency comes from simplicity — a stick figure
   redraws identically.
9. **Match the verb.** "It piles up" → boxes literally stack. "It drains away" →
   an arrow leaks out of a container. "It routes around" → an arrow bends past
   the blockage. Literal beats clever.
10. **STYLE LOCK block pasted verbatim into every Omni clip** (below). Stops Omni
    "upgrading" the drawing into a smooth 3D or photoreal scene.
11. **Voice lock verbatim every clip.** A calm, clear, teacherly narrator. Omni
    handles measured delivery fine.
12. **Product:** drawn as a simple marker outline of the real product's
    silhouette (locked proportions + which accent colour fills it). The real
    brand name / logo is **held out of generation and composited in post** onto
    the clean outline, unless a product image was uploaded to lock against — then
    describe it as a simple line drawing of that exact silhouette, label face left
    blank.
13. **Continuity:** frame-chain (harvest each clip's last frame — the partially
    filled board — as the next clip's start frame) so the board state carries
    across the cut. Reset internal timecodes to 00:00 each clip.

## Negative constraints (stills and clips)

```
no photorealism, no 3D, no realistic rendered scene, no smooth vector-graphics
reveal (keep the hand-drawn stutter and wobble), no full-sentence captions or
subtitles, no typeset or computer font (all board text is hand-lettered marker or
chalk), no brand logos or trademarked marks rendered by the model, more than
three marker colours on the board at once, glossy or plastic surfaces, gradient
shading, realistic human (except the drawing hand/forearm if used), motion blur,
camera push-ins or 3D camera moves, the board surface warping or bending
```

## STYLE LOCK block (paste verbatim into every Omni clip)

```
— STYLE LOCK (keep verbatim on every clip) —
Stay inside one hand-drawn [whiteboard / blackboard] universe. Everything is drawn
on the flat board in [black dry-erase marker / white chalk] with at most one
accent colour and, for problems only, red. No photoreal scene, no 3D, no smooth
digital animation. Every stroke appears progressively as if drawn by a real hand,
with slight wobble, uneven ink/chalk, and tiny overshoot at stroke ends — never a
clean vector wipe. Figures are simple stick or blob drawings; objects are simple
icons; labels are short hand-lettered words. The board stays flat and static; the
[camera] does not move. Erase-and-wipe transitions between regions. Do not render
a realistic environment, do not add typeset text, do not smooth the linework.
ASPECT: 9:16 vertical.
```

## Character (optional drawing hand)

If a visible hand draws the board, lock it like any character:

```
HAND LOCK — the same drawing hand and forearm every clip. [Skin tone + hex],
[sleeve: colour, cuff style, rolled/not], holding a [plain black marker / white
chalk stick] with no visible brand. The hand enters from the [bottom-right],
draws, and withdraws out of frame between beats. No jewellery, no watch, no
second hand in frame.
```

No hand is also fine — strokes simply appear. Decide once, hold it.

## Paste-ready skeletons

### Image keyframe — board state at the start of a clip (image model, style-override)

```
Hyper realistic photograph of a real [whiteboard / dark green chalkboard] on a
plain wall, shot straight-on, vertical 9:16, filling the frame edge to edge.

The board currently shows (drawn in [black dry-erase marker / white chalk], hand-
lettered, slightly uneven): [describe exactly what is already on the board at
this beat — e.g. "a small stick figure on the left, an arrow pointing right to a
box labelled 'THE FEE LOOP' in a hand-drawn rectangle, the box outlined in the
accent colour [name/hex]"]. Empty space on the [right / lower] half where the
next drawing will go. The problem element, if any, is in red. No other colours.

[If a drawing hand: a [skin tone] hand and forearm in a [sleeve] entering from
the bottom-right, holding a plain [marker/chalk], mid-stroke — the moment before
the next line is drawn, not the finished drawing.]

Flat even room light, no glare hotspot on the board, slight real marker/chalk
texture, faint ghosting of previously erased strokes. No typeset text, no logos,
no captions. Reads as a real photo of a real board mid-lesson, not a graphic.
9:16 vertical.
Negative Prompt: [the negative list above].
```

Subsequent board states LOCK to the first: open with
`BOARD LOCK — same board, same wall, same light, same accent colour [hex], same
existing drawing as the reference image. Now add only: [the one new element].`

### Video clip — Google Omni (≤10s)

```
A [7]-second hand-drawn [whiteboard / blackboard] explainer clip, vertical 9:16.
Use the attached image as the opening keyframe — match the board surface, the
existing hand-lettered drawing, the single accent colour and the flat room light
precisely.

00:00–00:07 — ONE drawn action: [e.g. "a hand enters from the bottom-right with a
[marker/chalk] and draws an arrow bending from the box down past a red blockage
to a small circled number, stroke by stroke, with real-hand wobble and uneven
ink; the hand withdraws as the last stroke lands"]. The board stays flat and
still. No other element changes. Only these new strokes appear.

VOICEOVER ([calm clear teacherly male/female, English]): "[line for this clip,
≤24 words, verbatim from 03-rebuild.md]"

State constraints: existing drawing unchanged, board does not warp, camera does
not move, no colour added beyond the accent and red, lettering stays hand-drawn.

AUDIO: soft [squeak of a dry-erase marker / tap and drag of chalk], faint room
tone, a light paper-and-desk ambience. [Voice lock, verbatim every clip: "calm
clear teacherly [gender] English voice, measured, unhurried, close and warm."]
No background music.

[STYLE LOCK block, verbatim, from above]

Negative: no photoreal scene, no 3D, no smooth vector reveal, no typeset text, no
full-sentence captions, no logos, no camera move, no board warp, linework stays
hand-drawn and uneven.

[If clip 2+:] Continue from the exact final frame of the previous clip. Same
board, same wall, same light, same accent colour, same existing drawing, same
voice. No reset, no angle change.
```

### Beat plan block (goes at the top of 04-prompts/whiteboard-marker-explainer.md)

```
Board variant: [whiteboard / blackboard]  ·  Accent colour: [name + hex]
Drawing hand: [yes — locked / no]

Clip 1 — Hook — draws: [the hook image, e.g. a stick figure staring at a rising
red line]. Board text: "[SHORT LABEL or none]". VO: "[line]".
Clip 2 — Problem/reframe — draws: [...]. Board text: "[...]". VO: "[line]".
Clip 3 — Mechanism — draws + boxes + names: "[MECHANISM NAME]". VO: "[line]".
Clip 4 — Proof — circles the number "[n]", before → after arrow. VO: "[line]".
Clip 5 — CTA — draws the product outline (accent fill), an arrow to a hand-drawn
button shape. Board text: "[SHORT CTA, 2–3 words]". VO: "[line]".
```

## Assembly notes
Generate board-state stills in order (each LOCKing to the first), then Omni clip
by clip, frame-chaining the last frame (the growing board) into the next clip's
start frame so the drawing accumulates continuously. Composite the real brand
name / logo onto the product outline in post. Burn centered VO captions for muted
viewing (the board's hand-lettered labels are the *idea*, the burned captions are
the *words*). If Omni garbles a hand-lettered label, generate that region clean
and add the label as a post overlay in a hand-marker font.

---

# HOUSE WORKFLOW — the operator's real, debugged process

Source: `references/house-workflows/talking-whiteboard-actor.md` (visible actor,
GPT Image 2 -> Seedance 2.5) and `blackboard-chalk-hand-only.md` (hand-only chalk).
This supersedes the quick scaffold above for any ad that matters.

## Structure
3 clips of ~13-15s each, ~44s total, **frame-chained** (each clip's final frame
becomes the next clip's opening-frame reference). Board layout is locked once:
**headlines stack vertically down the LEFT side, each new line directly below the
last, left-aligned; a small icon to the RIGHT of its matching headline.** Every
line in every clip follows that arrangement.

## Reference images
- **Image 1 - actor + blank board anchor.** Camera **perpendicular to the board's
  flat surface** - "board reads as a true flat rectangle, all four edges parallel
  to the frame, no keystoning, no perspective skew, no three-quarter angle."
  (Fix: a three-quarter board angle makes all text read tilted.) CHARACTER LOCK
  the persona; hold the marker uncapped and ready.
- **Image 2 - handwriting/icon style reference** (a filled board). Use in **Clip
  A only** to lock handwriting style + icon design + spatial layout. **Drop it
  from Clips B and C entirely** - its actual *content* bleeds forward (words
  appear before they're drawn). Style in later clips carries via each clip's own
  generated final frame.
- **Image 3 - product reference.** Clip C reveal only.
- **First/last-frame anchoring** (stronger than prose for end state): generate a
  target still showing exactly what the board looks like at the end of a clip,
  and tell Seedance that image is the **last frame**. If a board-only last frame
  contradicts a product reveal in the same clip, either make one true last frame
  with both the finished board *and* the product in hand, or drop the last-frame
  anchor for that clip and describe the ending in the timestep text.
- **A reference left attached in the platform's upload panel keeps influencing
  generation even after you remove it from the prompt text.** Physically remove
  it.

## Shared locks (name them, don't retype in full)
- **STYLE LOCK**: "Real documentary UGC footage, static locked camera, medium
  shot beside a dry-erase whiteboard, upper body and face visible, one hand free
  to write while the other rests or gestures naturally. Mouth precisely
  lip-synced to the dialogue throughout, while the hand writes **independently** -
  as though naturally explaining while illustrating, not pausing to speak then
  resuming writing. A single black marker for the entire clip, no colour changes,
  no marker switching. Marker ink renders as genuine dry-erase marker, not
  digital text or motion-graphic overlay. Handwriting is plain block capitals,
  legible at a glance. Icons stay minimal and schematic - one simple recognisable
  shape only, not detailed illustration. Board stays perfectly frontal, no
  keystoning. No captions/subtitles/on-screen text beyond what she physically
  writes. ASPECT: 9:16 vertical."
- **GAZE RULE**: "Her eyes and head stay directed at the whiteboard for the
  entire duration of every stroke. She does not look at the camera while her hand
  is actively writing or drawing. Between strokes, during brief natural pauses,
  she may glance toward the camera before returning to the board." (Fix: constant
  camera eye-contact while writing looks unnatural.)
- **VOICE-CONTINUITY FIREWALL (Clips B, C)**: when the previous clip is loaded as
  a voice reference - "Use the previous clip ONLY as a vocal-timbre reference:
  match accent, pitch, and speaking rhythm. Do not reproduce, repeat, or borrow
  any words, sentences, or dialogue content from it. The dialogue for this clip
  is exclusively the text in the DIALOGUE block. The lines spoken in the previous
  clip have already been delivered and must not be spoken again." (Fix: the video
  reference bleeds dialogue content, not just timbre, and the new clip repeats
  already-spoken lines.)
- **PRONUNCIATION NOTES** for anything the model mangles ("GLP-1 = G-L-P-one,
  hard P like 'pea', never a V sound"; "Ca-HMB = C-A, H-M-B, separate letters").
  In the dialogue lock *and* as a standalone note.

## Per-clip prompt shape
```
Use @image 1 (actor + blank board) as the opening frame. [Clip A only: use
@image 2 as layout + handwriting reference - headlines left column, icons right
column; follow this for every line in this clip and all that follow.]

[GAZE RULE - see Shared Locks]

The board starts exactly as in @image [N] and nothing already on it changes:
[full list of every existing element]. Do not redraw, restyle, resize, or move
any of it.
By the end of this clip the board may contain only those existing elements plus:
[the exact new elements]. Nothing else appears, ever.
Every word and icon is written by her hand, stroke by stroke, at natural
handwriting speed. Nothing appears before her hand draws it.

00:00-1.7s: she writes "[LABEL]" in block capitals in the [position], gaze on the
board.  Speech: "[matching phrase]"
1.7-3.0s: she underlines it in one stroke.  Speech: "[phrase]"  Brief glance to
camera as the stroke finishes.
[... every beat with its timecode + the draw action + the exact spoken phrase,
timed so a key word is on the board right as she says it ...]

DIALOGUE (warm [accent], calm, explanatory, lip-synced). This is the complete and
only dialogue: "[the full clip's dialogue]"

AUDIO: marker squeak on the strokes, [soft wiping sound on an erase], quiet room
tone, no music.

CONSTRAINTS: preserve identity and wardrobe as in @image 1, no keystoning or
angle skew, board perfectly frontal throughout, no readable text beyond what she
writes or the coat embroidery, no logos, no extra characters, no morphing hands,
nothing appears early or instantly, nothing repeats, nothing beyond what's listed.

[STYLE LOCK - see Shared Locks]
[Clips B, C: VOICE-CONTINUITY FIREWALL + "voice timbre locked to @video [N] but
dialogue content strictly limited to the DIALOGUE block above."]
```

## Physical mechanics beat abstract instructions
- Battery: not "it drains". Draw a **horizontal** battery outline ("a rectangle
  wider than it is tall with a small tab on its right end"), shade the interior
  solid black, then "wipe the black shading away from the right side with her
  fingertip, back to about half full. All shading and erasing happens **inside
  the battery outline only**. The [bicep] icon is not touched, shaded, filled, or
  altered at any point." (Fixes: battery drawn vertical / draining on its own /
  shading bleeding onto a neighbouring icon.) A leaner alternative: draw the
  battery "already at roughly a quarter to half filled, one clean action" and
  skip the shade-then-erase entirely.
- **Time budget per write action.** A line truncates or appears early when
  crammed into a ~2s beat with four other actions. Fix is **more time per beat**,
  not more words. Each write needs roughly its real handwriting duration.
- **Escalating specificity backfires.** Adding a hard numeric time cap +
  letter-by-letter spelled-out drawing made the next generation butcher the VO
  and lag drawing-vs-speech. Fix: revert to plain stroke-by-stroke language,
  state each rule once, give more time per beat. If still too dense to render
  reliably, **split the clip into two shorter clips** - not more rules.

## Pixar-pointer variant (see `house-workflows/pixar-whiteboard-pointer.md`)
Chibi-3D presenter with a wooden pointer stick; content appears one element at a
time (soft magical pop/chime SFX) as she points, timed to the script.
- **STICK-TARGET RULE**: the stick points only at the specific named word/icon,
  using an **explicit relative spatial anchor** ("one text-line below X, same
  left margin"), never "the empty space below X". The stick physically leads each
  new word into existence at its tip, not text-first-then-stick-finds-it.
- **A visual pose-reference image beats a written spatial description.** For a
  target low on the board, generate a low-pointing pose still (arm extended
  lower, stick tip in the bottom third) and match it exactly for those beats.
  Strongest single lesson from that workflow.
- **GLOW RULE**: any glow is a permanent fixed property of specific icons only
  (battery, checkmarks); it never pulses, moves, or transfers; nothing else ever
  glows; the only relevance indicator is the stick. (Otherwise the model reads
  "glow" as a dynamic "relevant now" highlight.)
- No disclosure burned in (hard rule 14).

## Blackboard / chalk variant (see `house-workflows/blackboard-chalk-hand-only.md`)
Hand-only, off-camera VO (not lip-synced), styled after a real chalk reference
video analysed frame by frame.
- **Blank board reference** includes a chalk tray with three sticks + a black
  felt eraser. Faint ghost-smudge worn texture, chalk dust in the air. Camera
  perpendicular (same keystoning fix).
- **CHALK COLOUR RULE**: three colours - white for headlines/outlines, pink/coral
  for circles/arrows/emphasis, pale yellow for supporting detail. One colour used
  for ALL its elements in one continuous pass, then set down; only then the next
  colour is picked up. Never switched back, never picked up again.
- **WIPE GESTURE**: partial, not a full clear - erases just the section being
  replaced. Wide arcing eraser strokes leaving **visible ghost-smudge residue**
  (this is what reads as real chalk, not a digital effect). Brief and practical.
- **Open the clip already mid-wipe.** A static shot of the finished board
  *before* the wipe is the real cause of "wipe taking too long" lag. Generate a
  "dusting-in-progress" opening frame: hand mid-arc with the eraser,
  motion-blurred marks, fresh pale smudge-streaks, chalk dust kicked up, "reads
  as a frame grabbed mid-action".
- **Product reveal**: cut to the real product at board height, small white chalk
  sparkle marks drawn around it, warm chime.
- **No disclosure overlay needed** - no character or credential claim on screen.

## Assembly
Generate Image 1 -> Clip A (Image 1 + Image 2) -> save Clip A's final frame as
Image 4 -> Clip B (Image 1 + Image 4 + Video 1 voice-only) -> save final frame as
Image 5 -> Clip C (Image 1 + Image 5 + Video 2 voice-only + Image 3 product) ->
stitch A, B, C with `tools/assemble.mjs`. No disclosure is burned in (hard
rule 14). Karaoke VO captions come from that pass.
