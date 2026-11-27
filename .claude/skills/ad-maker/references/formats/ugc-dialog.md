# Format Module — UGC Dialogue (two friends, shot / reverse shot)

Two people in a conversation, each filmed alone on their own phone framing,
cut back and forth on every line. One asks; the other explains. The asker
carries the viewer's doubts ("and I'm guessing I have to pay it back?"), the
explainer carries the mechanism, the conditions and the CTA. It is the
objection ladder as a scene.

**Engine stack:** every clip holds **one** face, so this is a face UGC format:
Seedance 2.0 prose with a reference pack per character → **Adsora Gen** when
its keys exist, else Evolink Seedance. Alternative: two Nanobanana Pro anchors
→ Google Omni, with the duplicate-still discipline from
`references/house-workflows/comedy-two-hander-ugc.md`. Read
`references/formats/ugc-yapper.md` (the per-clip craft) and
`references/production-discipline.md` §4–§5 (two identity locks, two voice
locks) first.

---

## When this format fits the DNA

- **A doubt-kill sequence.** The DNA answers three or four objections in a
  row — cost, catch, eligibility, risk. Each becomes a question from the
  asker.
- **Qualifying conditions** ("you own your home, right?", "credit above X?")
  — a checklist that would be a lecture from one person becomes banter from
  two.
- **A mechanism with a name people have not heard** — the asker's "a what?"
  is the viewer's, and the explainer's plain-English definition is the beat.
- **Friend-recommendation proof**: the product arrives as advice from someone
  who already used it, which is how most real purchases happen.

Skip it when the DNA is a single voice's story or needs the product in hand;
that is `ugc-yapper` / `in-car-ugc` / `talking-head`.

---

## Production rules

1. **Two of everything, never merged.** IDENTITY LOCK A + VOICE LOCK A, IDENTITY
   LOCK B + VOICE LOCK B, pasted verbatim into every clip that character
   appears in. Different ages, hair, wardrobe colours and vocal registers — the
   cut has to read at a glance.
2. **Two framings, both selfie-native, in one room.** A (the asker): seated,
   phone propped slightly below eye level, chest-up, a lived-in wall behind
   (a mantel, an instrument, a bookshelf). B (the explainer): standing or
   perched, handheld at arm's length, tighter, a *different* wall of the same
   room (or an adjacent room), so the backgrounds differ but the light matches.
   Lock both framings and both walls; they never change.
3. **The eyeline trick.** A looks a little right of the lens, B a little left
   of the lens — each is "looking at" the other across the cut. Neither looks
   straight down the lens except on the final CTA line. Put the direction in
   the character lock and in the constraints ("her eyes stay just right of the
   lens").
4. **Cut on every line.** A line is ≤ 12 words (≤ 5 seconds); the reaction
   lines are one or two words ("Really?", "A what?", "Yeah, why?") and get
   their own 2–3s clip. 30–45s total, 12–18 cuts. Never two consecutive lines
   from the same person unless the explainer is mid-definition.
5. **One clip = one line = one facial beat.** A: curiosity → suspicion →
   surprise → "okay, where do I go". B: patient → amused → matter-of-fact →
   direct on the CTA. Name the muscle movement, not the emotion.
6. **Numbers as words** in the dialogue ("thirty thousand to five hundred
   thousand dollars"); captions carry the digits.
7. **The explainer's last line is the CTA + the risk-reversal** ("the link
   below is what you're looking for — it's free to check and it doesn't
   affect your credit score"). The asker's last line before it is the
   permission ("Okay, tell me where I need to go.").
8. **Continuity per character.** Chain A's clips (A1 → A2 → …) with `@Video 1`
   and the continuation opener; chain B's separately. Two chains, not one.
9. **Silent listening clips.** Generate one 3s mouth-closed listening clip per
   character (small nods, eyes on the other person) for cutaways over the
   other's longest line — it sells that they are in the same room.
10. **No disclaimer** (hard rule 14). `"disclosure": false` and no category
    legal `text` card, whatever the product category. If the user asks for a
    line in that run, place it as a small boxed `text` over the first 4 seconds
    (`anchor: "top"`, `y` 0.08, `size` 16) in their wording.

## Negative constraints (`constraints:` clause, per clip — yapper clause plus)

```
only one person in frame, no second person or reflection, her eyes stay just
[right/left] of the lens and never drift to the camera, no phone visible,
the room and the wall behind her do not change, no wardrobe change, no
captions or on-screen text, mouth motion matches the spoken words, no
doubled audio, no music.
```

## Paste-ready skeletons

### Character references (once)

```
━━━━━━━━━━━━━━━━━━━━━━
A — THE ASKER — IDENTITY LOCK  (@Image 1 in A clips)
[age] [ethnicity] [gender], [hair], [eyes], [build], [solid-colour top],
[one imperfection with location]. Seated on a [sofa/chair], phone propped
below eye level, chest-up. Wall behind: [two named objects]. Eyes just RIGHT
of the lens.
VOICE LOCK A: [accent], quick, sceptical-friendly, rising intonation on questions.

B — THE EXPLAINER — IDENTITY LOCK  (@Image 2 in B clips)
[different age] [ethnicity] [gender], [different hair], [glasses?], [plaid /
patterned top], [one imperfection]. Standing, handheld at arm's length,
tighter framing. Wall behind: [two different objects, same room light]. Eyes
just LEFT of the lens.
VOICE LOCK B: [different accent or register], calm, matter-of-fact, dry.
━━━━━━━━━━━━━━━━━━━━━━
```

### Dialogue map (Stage 4 writes this before the prompts)

| # | Who | Line (verbatim from 03-rebuild.md) | Beat | ~s |
|---|---|---|---|---|
| 1 | A | "[question hook]" | leans in, half-joking | 4 |
| 2 | B | "[deflect / reframe]" | small smirk, shrug | 5 |
| 3 | A | "[the real need]" | drops the joke | 4 |
| 4 | B | "[qualifying question 1]" | eyebrow up | 3 |
| 5 | A | "Yeah, why?" | suspicious | 2 |
| … | | | | |
| n−1 | A | "[permission line]" | decided | 3 |
| n | B | "[CTA + risk reversal]" | straight to lens | 6 |

### Clip block (Seedance 2.0 prose, ≤ 6s each)

```
━━━━━━━━━━━━━━━━━━━━━━
CLIP 4 — B — 4s | handheld arm's length | ~[N]/2000 chars
━━━━━━━━━━━━━━━━━━━━━━
Continuation of clip 2, same speaker, same wall, same framing, picking up
mid-conversation. The [person] from @Image 2 holds the phone at arm's length,
slight wrist drift, eyes just left of the lens on the friend she is talking
to. One eyebrow lifts as she asks, and she tilts her head a fraction on the
last word, waiting. Close phone mic, quiet living-room tone, no music. She
says in a [accent], dry, matter-of-fact voice: "[line 4, verbatim]". Raw
phone footage, vertical 9:16.
constraints: [the clause above, with "left"].
```

### Assembly (`06-finals/ugc-dialog/assemble.json`)

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/ugc-dialog",
  "aspect": "9:16", "size": "1080x1920", "font": "Helvetica Neue",
  "captions": { "style": "plain", "wordsPerCue": 6, "y": 0.70, "size": 40, "uppercase": false },
  "disclosure": false,
  "jobs": [{
    "name": "ugc-dialog-final",
    "clips": [
      { "file": "05-assets/ugc-dialog/a1.mp4", "script": "[line 1]" },
      { "file": "05-assets/ugc-dialog/b1.mp4", "script": "[line 2]" },
      { "file": "05-assets/ugc-dialog/a2.mp4", "script": "[line 3]" },
      { "file": "05-assets/ugc-dialog/b2.mp4", "script": "[line 4 — the definition]",
        "cutaways": [{ "file": "05-assets/ugc-dialog/a-listen.mp4", "at": 1.5, "seconds": 1.4 }] },
      { "file": "05-assets/ugc-dialog/a3.mp4", "script": "Really?" },
      { "file": "05-assets/ugc-dialog/b-cta.mp4", "script": "[CTA + risk reversal]" }
    ]
  }]
}
```

## Assembly note

Plain sentence-level captions (not karaoke) — the reference dialogue ads use
a clean white sentence per cut; karaoke would fight the pace of the cuts.
Hard cuts only, no zoom alternation needed (the framing alternates by
itself). Check `heard` on every clip: a definition line with a mis-said number
is a re-roll, never a caption fix. Hook tests swap A1 (the question) and B1
(the deflection) only.

## Routing and cost

`ugc-dialog` is in `routing.face_ugc_formats`. Twelve to eighteen 2–6s clips
on Adsora Gen cost less than four long ones — this format is built for short
clips.
