# Format Module — Street Interview (live-action vox-pop)

An interviewer with a handheld mic stops a stranger on a sidewalk and asks one
question. The stranger's answer *is* the ad: the objection, the mechanism, the
result, the recommendation — delivered as social proof from someone who was not
supposed to be selling anything. The Pixar street interview
(`references/formats/pixar-3d-character.md`) is the animated cousin; this is the
live-action original.

**Engine stack:** Nanobanana Pro character anchors → Google Omni 16-block briefs
(native two-voice audio, ~10s cap) — the same stack as
`references/formats/hot-seat-crowd-qa.md`. Alternative: Seedance 2.0 prose,
image-to-video from the same anchors, through the default adapter. Read
`references/house-playbook.md` §2–§3 (locks, static camera) and
`references/production-discipline.md` first.

---

## When this format fits the DNA

- **Bandwagon / "everyone already knows this" proof.** The DNA sells by making
  the viewer feel late.
- **A question hook** ("What would you do with an extra $X a month?", "How much
  did you pay for yours?") — the interviewer asks it, a stranger answers it.
- **An objection crushed by a peer, not an expert.** The stranger *had* the
  doubt and got over it. Same job as the hot-seat crowd member, without the
  stage.
- **A price / result reveal** that lands harder as a surprised "wait, really?"
  from a passer-by than as a claim from the brand.

Do not pick it when the DNA needs authority or credentials — that is
`talking-head` or `expert-caught-in-moment`. Street answers are believed because
they are *ordinary*.

---

## The three builds

| Build | Shape | Reach for it when |
|---|---|---|
| **Single respondent** (default) | walk-up question → one stranger carries beats 2–N | the DNA is one story, one belief shift |
| **Montage** | same question to three strangers; the first two hold the old belief, the third holds the new one | the DNA's hook is "most people think X" |
| **Interviewer answers** | the stranger asks, the interviewer (a founder / employee with a lanyard) answers | the DNA is a mechanism explainer with a human face on it |

Say which build you chose in the prompt file, and why.

---

## Production rules

1. **Two IDENTITY LOCKS, never merged.** Interviewer and respondent each get a
   full describe on their anchor still and a verbatim lock in every clip. In the
   montage build each respondent is a new anchor (fresh fictional face — never a
   reproduction of a real person from the reference footage). **The interviewer
   is one person across every location:** the first two-shot still is her
   anchor, and every later two-shot still passes it as `image_urls` so her
   face, hair and mic carry over. Generated from text alone, the 2026-09-12
   montage gave three different interviewers and a mic that went black, white,
   black. `qa.mjs lint` fails any still that repeats her traits without the
   reference.
2. **One locked two-shot per respondent.** Sidewalk, storefront, campus path,
   farmers' market, parking-lot edge. Interviewer at frame-left holding the mic
   between them, respondent frame-right, both turned three-quarters toward
   each other. Camera locked off, eye level, slightly wide (waist-up), phone
   quality, daylight only. Restate the framing in every clip; the frame does
   not move.
3. **MIC LOCK.** Name the hand, the height and the look of the mic once and
   paste it every clip: *"a plain handheld reporter's microphone with a black
   foam windscreen and no logo cube, held in the interviewer's right hand at
   chest height, tilted toward whoever is speaking."* The mic never changes
   hands except in the one scripted pass (rule 8).
4. **GAZE LOCK: they look at each other, not the lens.** Exactly as the Pixar
   street interview. The only exception is the optional walk-up opener
   (rule 7). Put "no looking at the camera" in the negatives.
5. **Background people are set dressing.** "Pedestrians far behind them move
   naturally and never enter the mid-ground; nobody reacts, nobody looks at the
   camera; no one passes between the two people." Add to negatives.
6. **One question, one answer per clip.** The interviewer's question is short
   (≤ 10 words). The respondent's answer carries the beat (≤ 22 words per
   Omni clip, ≤ 35 per Seedance clip). Never split a sentence across clips.
7. **Walk-up opener (optional Clip 0).** The interviewer alone, phone at arm's
   length, walking toward the lens with the question. This is the one clip that
   addresses camera. Then hard cut to the two-shot. It is the fastest hook in
   the format.
8. **The single gesture** available is the mic pass or mic tilt. Everything
   else is face and posture: the respondent's arc is *polite → surprised →
   leaning in → convinced*. Name the shift per clip in physical terms.
9. **Ambient audio is part of the scene**, inline every clip: light traffic
   wash, distant voices, a breeze on the foam, roomy handheld-mic character. No
   music in generation.
10. **Numbers spoken as words**, burned captions use digits.
11. **The edit is cut + caption + card, run by the skill.** No disclaimer
    (hard rule 14): `"disclosure": false`, even though the format is a staged
    social-proof piece. Only the user's own request in that run changes this.
12. **An American street, and a named US region in every voice.** The still
    decides the accent more than the voice line does: an i2v clip voices the
    place it sees. On 2026-09-12, stills prompted with "pavement", "car park"
    and "flat cap" rendered a British high street, and every speaker whose
    voice line said only "General American" came back British (3/3) while the
    two who had "Upper-Midwest" and "Southern" held (3/3). So: American words
    in every still ("sidewalk", "parking lot", "storefront"), an American
    locale anchor in the ENVIRONMENT LOCK ("a suburban Texas strip-mall
    sidewalk", "US license plates on the parked cars"), and a **different named
    US region** for each speaker so the voices also stay distinct. Never
    "mid-Atlantic" — that is the transatlantic, half-British accent.
13. **The interviewer's follow-up is a silent reaction, or trimmed hard.** A
    three-word "Over the old floor?" in a 5 s clip gets spoken twice to fill it.
    Either make it a mouth-closed reaction clip with no line, or trim to the
    first reading (`qa.mjs clips` flags the repeat).

## Negative constraints (pool — pick 4–8 per clip)

```
no subtitles, no captions, no on-screen text, no readable signage or shop
names, no logos, no logo cube on the microphone, no second microphone, no
phone visible, no camera visible, no looking at the camera, no gaze drift,
no background pedestrian reactions, no one passing between the two people,
no camera movement or drift, no wardrobe change, no identity drift, no
morphing hands on the mic, no doubled or echoed audio, no music, no beauty
filter, no cinematic colour grade.
```

## Paste-ready skeletons

### Character references (once, above the clips)

```
━━━━━━━━━━━━━━━━━━━━━━
INTERVIEWER — IDENTITY LOCK
━━━━━━━━━━━━━━━━━━━━━━
[age] [ethnicity] [gender], [hair], [eyes], [build], wearing [top / jacket],
[one imperfection with location]. Energy: friendly, quick, curious.
Voice: [named US region] American accent (e.g. "Southern California"), upbeat, clear, reporter cadence, slightly loud for the street.
MIC LOCK: a plain handheld reporter's microphone with a black foam windscreen
and no logo cube, held in the interviewer's right hand at chest height.

RESPONDENT — IDENTITY LOCK
[age] [ethnicity] [gender], [hair], [eyes], [build], wearing [top],
carrying [one real object — a tote, a coffee]. Energy: caught off guard, then
warming up.
Voice: [a DIFFERENT named US region] American accent (e.g. "Upper-Midwest"), conversational, unrehearsed pauses.

ENVIRONMENT LOCK: [a specific AMERICAN sidewalk — a US locale anchor ("a suburban
Texas strip mall", "US license plates"), two named background objects, time of
day, weather]. Locked-off phone camera, eye level, waist-up two-shot,
interviewer frame-left, respondent frame-right, mic between them.
━━━━━━━━━━━━━━━━━━━━━━
```

### Still prompts (Nanobanana Pro)

- **Frame A — two-shot, question moment.** `Hyper realistic candid street
  footage still (no bokeh, no portrait mode):` both characters as locked, the
  interviewer mid-question with the mic tilted toward the respondent, the
  respondent's mouth closed, eyebrows just lifting. Daylight, deep focus,
  candid mobile camera quality. *No phone visible anywhere in frame.*
- **Frame A′ — duplicate of A** (fresh file, same pose) for every clip that
  restarts from this pose — see `production-discipline.md` §0.
- **Frame B — answer moment.** CHARACTER LOCK both; mic now tilted toward the
  respondent, who is mid-sentence, one hand slightly raised.
- **Frame W — walk-up** (optional). Interviewer alone, arm's-length selfie
  framing on the same sidewalk, mic in the other hand, mid-stride.
- **Montage build:** Frames A2/B2, A3/B3 with new respondents, same
  interviewer, same or adjacent sidewalk.

### Clip prompt (Omni 16-block, ≤10s)

```
FORMAT: Create an 8-second vertical 9:16 realistic street-interview video.
QUALITY / FIDELITY LOCK: [verbatim house block — raw phone footage, no
sharpening, no beauty filter, no grade]
IDENTITY LOCK (interviewer): @image1 — [verbatim]
IDENTITY LOCK (respondent): @image1 — [verbatim]
OUTFIT LOCK: [verbatim]
ENVIRONMENT LOCK: [verbatim sidewalk block]
SCENE: [time of day, light]
BACKGROUND OBJECTS: [the two named objects]; distant pedestrians only.
CAMERA: Locked-off phone, eye level, waist-up two-shot matching @image1
exactly. Zero movement, zero drift. One continuous take.
CAMERA REVEAL BEAT: none.
PERFORMANCE VIBE + ACTION: street-interview energy — quick question, honest
answer. Interviewer: [line] — tilts the mic toward the respondent on the last
word. Respondent: [line] — [physical beat: eyebrows up, a half-laugh, leans
toward the mic]. Both keep eye contact with each other the whole clip.
VOICE (interviewer): [verbatim lock]
VOICE (respondent): [verbatim lock]
DIALOGUE: Interviewer says exactly: "[question]". Respondent says exactly:
"[answer, verbatim from 03-rebuild.md]".
TIMING: question in the first 2 seconds, answer fills the rest, half a second
of silence before the cut.
AUDIO / ENVIRONMENT: handheld mic character, light traffic wash, a breeze on
the foam, no music.
STYLE: real vox-pop clip, phone footage, natural skin texture.
NEGATIVE CONSTRAINTS: [4–8 from the pool]
```

### Clip prompt (Seedance 2.0 prose alternative, ≤15s)

One flowing paragraph from Frame A as `@Image 1`: who (both locks compressed),
the sidewalk and the locked framing, the question tilting the mic, the answer
verbatim with the respondent's physical beat, the ambient sound inline, then a
`constraints:` clause from the pool. Motion in every sentence.

## Assembly notes (tools/assemble.mjs — the skill runs this)

- Cut order: [W] → A-clips in beat order → CTA clip → end card.
- **Reaction cutaways:** generate one silent 3s clip per character (mouth
  closed, nodding, eyes on the other person — `VOICE: N/A`, `AUDIO: completely
  silent`) and lay it over the *other* person's longest line as a `cutaways`
  entry with `mute` semantics (the underlying audio is untouched).
- **Product / place b-roll** over the mechanism line only (`broll` with
  `from` ≥ 0.8, `to` ≤ −1.2).
- Captions: karaoke, 2–3 words, `y` 0.78, lower third.
- `disclosure`: `false` (hard rule 14, no disclaimer).
- End card: text-only comment-bait if the DNA has one, otherwise the CTA stays
  on the respondent's last line.
- Montage build: one job per hook variant — swap only the first respondent's
  clips; the closing respondent and the CTA stay identical.

```jsonc
{ "name": "street-interview-final",
  "clips": [
    { "file": "05-assets/street-interview/clip-w.mp4",  "script": "[walk-up question]" },
    { "file": "05-assets/street-interview/clip-1.mp4",  "script": "[question + answer 1]", "zoom": 1.0 },
    { "file": "05-assets/street-interview/clip-2.mp4",  "script": "[answer 2]", "zoom": 1.08,
      "cutaways": [{ "file": "05-assets/street-interview/react-interviewer.mp4", "at": 1.2, "seconds": 1.6 }] },
    { "file": "05-assets/street-interview/clip-3.mp4",  "script": "[mechanism]", "broll": { "dir": "[b-roll folder]", "hold": 2.2 } },
    { "file": "05-assets/street-interview/clip-4.mp4",  "script": "[CTA]" }
  ] }
```
