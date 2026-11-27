# Format Module — In-Car UGC (parked-car confessional)

One person in the driver's seat of a parked car, talking to their phone. The
most private public place there is: the viewer has sat exactly there, engine
off, saying something out loud before going inside. It carries "I just found
out / I just left / I just got the call" immediacy better than any room.

**Engine stack:** the `ugc-yapper` stack — Seedance 2.0 prose with a reference
pack (speaker still as `@Image 1`), routed to **Adsora Gen** when its keys are
present (this is a face-to-camera UGC format; it is in
`routing.face_ugc_formats`). Alternative: Nanobanana Pro still → Google Omni.
Read `references/formats/ugc-yapper.md` for the yapper rules — everything there
applies — then this file for what the car changes.

---

## When this format fits the DNA

- **Immediacy hooks** — "I literally just walked out of…", "they just called
  me", "I'm sitting in the parking lot because I had to tell someone".
- **Private confession / venting** — money, health, a bad quote, a bad job.
  The car reads as unfiltered because nobody films a considered opinion in a
  parking lot.
- **Dead-time monologues** — school pickup line, lunch break, before going in.
  Fits any "here's what nobody tells you" script.
- **Service and quote stories** (home services, legal intake, insurance,
  refunds): the speaker is *between* the appointment and home. The paper quote
  or letter in hand is the prop.

Skip it when the DNA needs the product in use, a demonstration, or a second
person — the car is a one-person box.

---

## Capture modes (pick one per script, name it in every clip)

| Mode | Camera | Feels like |
|---|---|---|
| **Dash / vent mount** (default) | phone on a vent mount, locked off, slightly below eye level, the top of the steering wheel at the bottom edge of frame | a car vlogger; steadiest lip-sync |
| **Handheld selfie** | arm's length, front camera, micro wrist drift, headrest and B-pillar behind | the raw "I have to tell you this" rant |
| **Passenger seat, propped** | phone propped on the passenger seat / dash, three-quarter angle | calmer, review energy |

---

## Production rules

1. **Parked. Engine off. Always.** State it in the prompt and in the negatives:
   *"the car is parked and stationary, engine off, no hands on the wheel, the
   view through every window does not move."* Filming while driving fails ad
   review and reads as reckless. Seatbelt off, or still on as the "just
   parked" tell — pick one and lock it.
2. **The windows are the set.** Name what is through them once and lock it: a
   half-empty parking lot, a driveway hedge, a strip-mall storefront (no readable
   sign), a school fence. Daylight through the windshield and side window,
   warm if late afternoon. Nothing outside moves except leaves.
3. **Car interior is a lock, not a brand.** "Grey cloth seats, black plastic
   dash, a fabric headrest, a rear seat visible behind the shoulder." Never a
   badge, never a brand, never a screen on the dash (screens draw text
   artifacts). Add a hanging air freshener or a coffee in the cup holder as
   the two lived-in objects.
4. **Audio is a small enclosed space.** Inline every clip: close-mic phone
   compression, a slightly boxy reflection off the glass, faint outside
   traffic through the windows, an occasional car passing, no music, no
   engine, no AC hum unless scripted.
5. **Character anchor once**, exactly as the yapper module: age, ethnicity,
   hair, eyes, build, top, energy, voice line. Same reference pack for every
   clip. The car keeps them in the same seat, so consistency is easier than
   any other live-action format — do not waste it with a mode change mid-ad.
6. **The prop is paper, not a phone.** A folded quote, an envelope, a letter,
   a printed estimate — held up to the lens for one beat on the proof line,
   text kept unreadable in generation (`no readable text on the paper`) and
   the real figure burned in as a caption or a `text` overlay in the edit.
7. **Segment at ~40–45 words / ~15s**, cut only at the end of a sentence, half
   a second of silence before each cut. Open on the face, end on the face.
8. **One physical beat per segment**, tied to a line: a head drop against the
   headrest, a hand over the mouth, a look out the window and back, a laugh
   into the steering wheel. Never a big gesture — the space is too small.
9. **Chain clips** by passing clip N as `@Video 1` into clip N+1 with the
   continuation opener from the yapper module.
10. **Windshield reflections are allowed and wanted** (they sell the car); a
    second face in the rear-view mirror is not — it is the format's signature
    failure. Put "no face in the rear-view mirror" in every clip's constraints.

## Negative constraints (`constraints:` clause, per clip)

```
constraints: the car is parked and stationary with the engine off, nothing
outside the windows moves, no hands on the steering wheel, no driving, no
face or reflection of a second person in the rear-view mirror, no phone or
mount visible in frame, no dash screen, no badges or logos anywhere in the
car, no readable text on the paper or outside the window, no captions, no
subtitles, no extra passengers, no seat-belt warping, no headrest morphing,
preserve the speaker's identity and wardrobe, mouth motion matches the
spoken words, no doubled audio, no music, no beauty filter, no cinematic
colour grade.
```

## Paste-ready skeleton (Seedance 2.0 prose, ≤2000 chars)

```
━━━━━━━━━━━━━━━━━━━━━━
CLIP 1 — 14s | dash mount, parked | ~[N]/2000 chars
━━━━━━━━━━━━━━━━━━━━━━
The [person] from @Image 1 sits in the driver's seat of a parked car, engine
off, filmed from a phone on a vent mount slightly below eye level so the top
of the steering wheel cuts across the bottom of the frame. Grey cloth seats, a
fabric headrest behind her, a coffee in the cup holder, a paper air freshener
swinging once and settling. Through the windshield: a half-empty parking lot in
flat afternoon light, nothing moving. She has just pulled her seatbelt off and
turns to the lens like she has been holding this in. As the first line lands
her eyebrows go up and she taps the wheel once; on the second idea she drops
her head back against the headrest and laughs at herself before looking back.
Close phone-mic sound, a boxy reflection off the glass, one car passing
faintly outside, no music. She says in a [accent], [tone] voice: "[exact lines
for this segment, verbatim from 03-rebuild.md]". Raw parked-car confessional,
vertical 9:16.
constraints: [the clause above].
```

**Proof beat:** *She lifts a folded printed quote into frame with her free
hand and holds it still beside her face for a beat, the text on it too small
to read, then drops it onto the passenger seat.*

## Assembly notes (tools/assemble.mjs — the skill runs this)

- Captions: karaoke, 3 words, `y` 0.72 — the framing is tight, keep them off
  the chin and off the wheel.
- The real number from the prop goes on as `text` (`anchor: "top"`, `y` 0.10,
  boxed) for the length of the proof beat, or as the persistent `banner` if
  the DNA has an offer line.
- Cutaways: rarely. If the mechanism beat needs picture, a 2s `region: "bottom"`
  insert of the product / the place keeps the face on screen (see
  `ugc-tiktok-comment.md` for the half-frame pattern).
- `zoom` alternates 1 / 1.08 between consecutive segments; the dash-mount
  framing has no motion of its own, so the punch-in is the cut.
- `disclosure`: `false` (hard rule 14, no disclaimer).
- End card: optional; the CTA usually stays on the face.

## Routing and cost

`in-car-ugc` is a face UGC format: Adsora Gen when `RUNPOD_API_KEY` +
`RUNPOD_VIDEO_ENDPOINT_ID` exist locally, otherwise Evolink Seedance and the
quote says so. Several 6–10s clips beat one 15s clip on Adsora Gen cost.
