# Format Module — 3D Pixar-Style Character Ad

Each ingredient, feature, benefit, or problem becomes its own Pixar-style 3D
character that talks straight to camera for 1–2 punchy sentences. The product
character closes with the CTA. Viral "talking ingredients" format.

**Engine stack:** character stills in an image model (Nano Banana 2 / Gemini, or
any capable 3D-render image model) → Kling image-to-video (talking) → ElevenLabs
VO per character → assembly + word-highlighted captions in the editor.
Read `references/production-discipline.md` first.

---

## When this format fits the DNA
A mechanism that breaks cleanly into 3–5 named parts · a problem you can
personify as the thing itself · high entertainment tolerance · a benefit stack
that can be split one-per-character.

---

## Production rules

1. **Characters are REAL things, never invented mascots.** The organ, the
   ingredient, the hormone, the fee, the competitor, the actual product. The
   viewer already has a relationship with a "belly fat" or a "monthly fee". A
   "cravings goblin" makes them learn a new concept first. To represent an
   abstraction, use the body part or object responsible.
   **If the product is pure software or a service with no physical or biological
   parts:** only use concept-as-character mode if you can name at least three
   concrete real objects or parties involved (the phone, the notification, the
   calendar, the competitor app, the subscription). If you cannot, switch to
   **avatar-scene mode** — one Pixar-style person acts out the competitor's beats
   in simple 3D scenes — using the same character-consistency locks (model the
   avatar's turnaround as the anchor, LOCK it on every later still). Do not force
   weak personifications.
2. **Ingredients/mechanisms look like what they are *inside* the body / system,**
   not like their packaging. The only character that looks like a product on a
   shelf is the brand character at the end.
3. **Identity in one beat, benefit as a feeling.** `"I'm [thing]. [1–2 sentences
   about what changes for YOU]."` Spoken TO the viewer ("Take me if…"). Plain
   words a 12-year-old gets. No mechanism language — they care WHAT it does, not
   HOW.
4. **Max 2 sentences per non-brand character** (3–4 for the brand closer). If
   you're on a third sentence, cut it.
5. **Connected story, not a lineup.** Each line answers the one before. Villain
   states the problem → hero ingredient answers *that specific problem* in the
   same language → brand tells you how to get the hero. Value props must thread.
6. **Villains are cocky, not menacing.** Smug, comfortable, "I'm not leaving."
   Calmer is funnier.
7. **Brand character = the real physical product form** (vial / bottle / pen /
   pouch / app icon). Real brand colours. Its line has exactly: brand name, how
   to get it, price. Optional: one social-proof clause. No restating benefits.
8. **Distinct colour palette + one signature gesture per character.** Villains:
   smug/lazy poses. Heroes: warm, confident, bright.
9. **Consistency:** each character is one locked still (front-facing, talking
   pose). Regenerate 2–3× if the mouth animation is weak. Do NOT re-describe the
   character in the Kling prompt — the image already holds the look.
10. **Clip length:** 5–8s per character. 9:16. One character per clip.

## Negative constraints

**Image prompts:**
```
no packaging or product box for body-internal characters, no invented cartoon
monster, no text or logos rendered in the image, no watermark, not photorealistic
human, no uncanny realism, keep it stylised Pixar 3D, single character only,
vertical 9:16, plain uncluttered background.
```

**Kling prompts:**
```
no change to the character's colours, shape, or lighting (the image holds them),
no extra characters entering frame, no floating text or captions, no camera cuts,
smooth natural mouth movement synced to the words, no jitter, no morphing of the
body, one continuous shot.
```

## Paste-ready skeletons

### Image prompt — one per character

```
A [personality adjective] anthropomorphic [real thing] character, [body shape +
exact colours + surface — e.g. "rounded translucent amber blob with a soft
sheen"], [facial expression matching personality], [pose and arms — the signature
gesture], set [inside the relevant body part / simple environment], [soft warm
lighting], Pixar-style 3D render, hyper detailed, shallow depth of field,
vertical composition 9:16.
```

Brand character variant: `A friendly confident [exact product form —
"squeezable matte-white tube with a mint-green cap"] character, [brand colour
palette from the real product], warm smile, one arm raised in a small wave,
clean neutral background, Pixar-style 3D render, hyper detailed, shallow depth
of field, vertical composition 9:16.` (Label text added in post, not generated.)

### Kling prompt — one per character (image already loaded)

```
Animate the referred image looking directly into the camera, mouth opening and
closing naturally as if speaking the words "[EXACT DIALOGUE, punctuation
removed]", [one signature action — nestles deeper / ripples gently / leans
forward / crosses arms smugly], Pixar-style animation, smooth natural motion.
```

### Script block (goes in 04-prompts/pixar-3d-character.md and feeds the VO)

```
Character 1 — [real thing] ([one-line visual]):
"I'm [thing]. [1–2 sentence feeling-benefit, TO the viewer]."

Character 2 — [real thing] ([visual]):
"I'm [thing]. [answers Character 1's problem in the same words]."

...

Brand — [product form] ([brand colours]):
"And I'm [BRAND]. [How to get it]. [Price]. [Optional: social proof]."
```

## Assembly notes
Generate every character still first, confirm the look, then Kling each one.
ElevenLabs VO per character (match voice to personality — warm/trustworthy for
heroes, punchy for villains, confident for the brand CTA). In the assembly pass
(`tools/assemble.mjs`, run by the skill): lay clips in script order, full audio
track underneath, karaoke captions with a bold white / highlighted-active-word
style, export 1080×1920. The persuasion
DNA is carried by the *order and connection* of the character lines — keep the
competitor ad's beat sequence mapped onto villain → hero → brand.

---

# HOUSE WORKFLOW — Pixar Street Interview (two-character narrative scene)

Full worked example: `references/house-workflows/pixar-street-interview.md`. Also
read `references/house-playbook.md`. This is a narrative variant of the Pixar
format — not concept-as-character talking heads, but two Pixar characters acting
out a vox-pop / interview scene.

Reference build: `references/house-workflows/pixar-whiteboard-pointer.md` covers
the Pixar presenter + progressive-reveal pointer approach (see the whiteboard
module's house section for STICK-TARGET and pose-reference lessons).

## The street-interview build
- **Two Pixar characters** (e.g. an eager animal interviewer + a deadpan expert),
  comedic contrast, distinct voices per character.
- **One single locked reference frame for the ENTIRE video.** Every clip reloads
  the same `@image1` with the exact same framing, angle, and composition. No
  camera movement, ever.
- **Characters keep eye contact with EACH OTHER, never the camera.**
- **Separate IDENTITY LOCK per character** (`IDENTITY LOCK — DOG:` / `IDENTITY
  LOCK — CAT:`), each pinning that character's design, outfit, and stance to
  `@image1`. Plus QUALITY/FIDELITY LOCK (preserve the Pixar render, "do not
  convert to photorealism, do not flatten the stylization"), ENVIRONMENT LOCK,
  and a CAMERA block ("static, completely locked-off... the frame does not
  move").
- **PERFORMANCE**: "both characters hold the exact body positions from the
  reference image the entire time; only head, ears, mouth, tail move." One
  deliberate gesture per clip, max (e.g. the expert reaching into a coat pocket
  to produce the product).
- **Revision-prompt pattern** for tweaking the reference frame: "TWO SMALL
  ADJUSTMENTS ONLY: 1. [add a slight gap between the characters]. 2. [neutral
  pose]. Everything else stays exactly as shown." with a CHARACTER LOCK.
- **7 short clips (~50s), hard cuts only, no crossfades** — hard cutting is what
  sells the fast pace when no single clip has camera movement.
- Beat structure: approach → problem question → mechanism explanation → react/
  escalate → solution question → product produced (the "aha") → CTA (delivered by
  the expert, not the interviewer).
- Product = load as `@image2`; PRODUCT LOCK on the label. Nothing textual is
  generated: subtitles burn from the VO in post, on by default (hard rule 23),
  and a name plate or label is composited there too.
- If a merged two-line clip runs near the 10s Omni ceiling and comes back rushed,
  split it back into two.
