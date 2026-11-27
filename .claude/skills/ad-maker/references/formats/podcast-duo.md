# Format Module — Podcast / Interview Duo

Two people in a podcast-style setup discussing the problem and the product. Host
asks the questions the *prospect* would ask; guest (founder / expert / user)
answers. Feels like eavesdropping on the most interesting 90 seconds of a
2-hour conversation, not an ad.

**Engine stack (default): Adsora Gen, not Seedance.** Hyper-real stills
(Nanobanana Pro, Evolink) → **animation on Adsora Gen** — our own MiniMax H3 on
our GPU, run by `tools/adsoragen.mjs`, whenever `node tools/adsoragen.mjs
--health` says `LIVE` (`config/generators.json` → `routing.face_ugc_formats`
now lists `podcast-duo`). Each speaker's clip is one **`i2v` pass from that
speaker's still with H3's own native audio** (lip-sync and voice in one pass,
accent as a prompt line); alternate host/guest clips as the cut demands, and
split any long single-speaker beat into a chain — never the `avatar` mux for a
long read (`references/adsoragen-video.md`, `references/talking-head-long-form.md`).
When Adsora Gen is not live it **falls back to Evolink Seedance** (2.0 i2v; Kling
3.0 / Google Omni are the vendor equivalents) and the cost quote says so. Read
`references/adsoragen-video.md`, `references/model-specs.md` and
`references/production-discipline.md` first.

---

## When this format fits the DNA
Heavy objection handling · authority / credentials · a complex mechanism that
needs explaining · a founder or expert voice. If the competitor ad was itself a
podcast/interview, this is the near-1:1 rebuild.

---

## Production rules

1. **Two anchored characters, angled inward.** Left host three-quarter to the
   right; right host three-quarter to the left, so solo close-ups intercut as a
   real conversation. Derive each tight close-up FROM one shared studio two-shot
   so wardrobe, mic, chair, wall, and lighting all match.
2. **Keep a wide two-shot** as the opener and as a reaction cutaway.
3. **GAZE LOCK.** Each host's eyeline is decided once and held every clip:
   talking to the co-host (three-quarter) is the default. Straight-to-lens is the
   exception, used deliberately for the CTA only. State the eyeline in the prompt
   AND the negatives ("looking at co-host, not the camera").
4. **One locked voice block PER speaker**, pasted byte-for-byte in every one of
   that speaker's clips. Never a shared block across both — they'll sound alike.
   Lock accent + delivery descriptor identically too.
5. **Mics visible in frame**, fixed. Warm studio or home-office background, soft
   even light.
6. **Alternate dominant-job clips** — host question clip, guest answer clip. One
   spoken thought per clip. At least one genuine "wait, really?" reaction beat
   from the host (never "wow, that's amazing" — infomercial tell).
7. **Mix in B-roll:** a lifestyle shot of the problem, a product B-roll (label
   reveal, product in use). A podcast that is only two talking heads feels less
   real.
8. **Clip length:** host question 4–6s, guest answer 6–9s, B-roll 3–5s, CTA 4–6s.
   Never over ~10s. Split long answers at a natural pause; the second clip is a
   continuation from the first's last frame.
9. **Product:** held in hand for any product beat (not staged on the desk).
   Label locked from a reference image, or held out and composited in post.
10. **Emotion via micro-expressions**, not big gestures. Kling amplifies hand
    motion — keep gestures minimal and always resolving back to rest.

## Negative constraints (put 3–6 targeted per clip, these are the pool)

```
no phone visible anywhere in frame, no captions or on-screen text, neither
speaker drifts position, microphones stay fixed in the foreground, no angle
shift between clips, no background motion, mouth motion matches the dialogue
exactly, no doubled or echoed words, [SPEAKER] looks at the co-host and never
turns to the lens (except the CTA clip), no jerky hand movement, hands return to
rest, lighting does not flicker or shift, skin keeps natural texture and pores,
no beauty-filter smoothing, no studio strobe or ring light, product label stays
facing camera and readable, no label warping or AI-generated text
```

## Paste-ready skeletons

### Still — the studio two-shot (Frame A, NEW anchor, Nanobanana Pro)

```
Hyper realistic candid UGC phone-propped shot ONLY (no bokeh, no portrait mode):
Two people seated across a small podcast table in a warm home-office studio,
three-quarter angle so both are turned slightly toward each other. LEFT: [age,
gender, ethnicity, build], [hair length/texture/colour], [2 imperfections with
location], wearing [garment + colour], seated angled to the right. RIGHT: [same
level of detail], seated angled to the left. Two identical dark cardioid
microphones on small boom arms, one in front of each person, fixed. Background:
[acoustic panel / shelf with 2–3 named objects / plant], soft even daylight from
a front-side window around 5200K. Both have a relaxed, warm, content expression,
soft natural gaze toward each other. Candid mobile camera quality, natural
colour, mild compression, slight sharpening. Deep focus, no artificial blur.
No phone visible anywhere in frame. No phone on the table. No captions.
9:16 vertical.
```

### Still — solo close-up derived from the two-shot (Frame B, LOCK to A)

```
Hyper realistic candid UGC phone-propped shot ONLY (no bokeh, no portrait mode):
CHARACTER LOCK — same person as the reference image (the LEFT speaker from the
two-shot). Same face: [jaw], [nose], [eye colour/shape], [brows], [marks]. Same
[hair]. Same [skin tone + hex]. Same [garment]. Same studio: [background
objects], same wall, same warm daylight. Do not change any of these.
Medium close-up of just this speaker, three-quarter angle turned to the right
toward the (off-frame) co-host, [microphone] close in front. Relaxed, engaged,
listening expression, soft gaze off-frame right. Deep focus, no artificial blur.
Candid mobile camera quality. No phone visible anywhere in frame. No captions.
9:16 vertical.
```

### Clip — guest answer (Adsora Gen `i2v` from Frame B, native audio; flowing prose, ~1400 chars. Same prose works for the Seedance/Kling fallback.)

```
Realistic 9:16 podcast solo close-up, vertical phone framing. [GUEST name]:
[50–80 words grounding — age, ethnicity, hair behaviour, the calm measured
energy of someone explaining something they know cold, warm [accent] delivery].
She begins already settled in frame, a small nod as if the question just landed.
The single dominant action is a steady explanatory delivery to the off-frame
co-host on her right, one hand lifting an inch off the table on the key phrase
and returning to rest. Her eyeline stays on the co-host and never turns to the
lens. Microphone stays fixed in the foreground, chair does not shift, lighting
does not flicker, sleeves stay as they are, skin keeps natural pores and a stray
hair catching the light. Performance: soft eye contact off-frame right, one
eyebrow lifts slightly during the mechanism beat, a single micro-nod at the
payoff phrase near the end, relaxed jaw, small un-forced smile. GENERATE NATIVE
AUDIO AND LIP-SYNC TO EXACT DIALOGUE: "[exact guest line from 03-rebuild.md]".
Close candid podcast-mic audio, slightly compressed, warm, human, imperfect,
same mic distance throughout, quiet studio room tone, no background music, warm
[region] female voice, relaxed and unhurried. Negatives: no phone visible, no
captions, speaker does not drift position, mic stays fixed, no angle shift,
mouth motion matches the dialogue, no echoed words, no jerky hand movement,
hands return to rest, lighting steady.
[Continuity block only if this clip continues a split answer.]
```

### Clip — host reaction / question (same structure, host's locked voice block, eyeline on the guest)

Use the host's own byte-for-byte voice block. Dominant action: "leans in an inch
on the question and settles back" OR "a genuine small double-take". One line of
dialogue. Same negative pool.

## Assembly notes
Generate: two-shot A → host solo B → guest solo C → any B-roll stills → clips in
cut order. Open on the wide two-shot (or a hook clip from the guest). Alternate
host/guest clips; drop the wide two-shot back in as a reaction cutaway to cover
any position jump. Composite the product label onto the product B-roll frame in
post. Burn centered VO captions for muted viewing. Adsora Gen (H3) and Seedance
both hold a subdued delivery, so no VO repair is usually needed on the default
path; only on the Kling fallback flag any subdued line for ElevenLabs
replacement (Kling forces upbeat).

---

# HOUSE WORKFLOW — Two-Character Broadcast / Interview

Full worked example: `references/house-workflows/two-character-broadcast.md`.
Also read `references/house-playbook.md`.

An anchor and an expert guest in a locked studio, trading lines in a real
back-and-forth (question / answer), with on-screen banner graphics. This is the
broadcast/interview/debate cousin of the podcast duo.

## Build order (differs from the base module)
1. **Generate the studio set EMPTY first**, before any characters. This becomes
   the environment reference for every still that follows. Template: "An empty
   [broadcast news studio], photoreal. [Desk, two empty chairs angled slightly
   toward each other, background treatment, lighting]. Camera static and level,
   wide establishing framing. Photoreal, professional lighting, shallow depth of
   field, deep focus on the foreground. 9:16. Negative: no people, no extra
   on-screen text, no garbled text."
2. **If the format uses a banner graphic, describe it fully in a STILL** (exact
   text, position, colours) — a still renders text far more reliably than video.
   That still becomes the graphic's locked reference for every later still and
   clip.
3. **Lock each character independently** into the set: their own reference photo
   for identity + the empty-set image for environment. `ENVIRONMENT LOCK, same
   set exactly` + `CHARACTER LOCK, [neutral factual description — no amplifier
   words]`.
4. **Generate a second close-up variant per character** with their gaze angled
   toward the other character's side of frame. Cutting between the two
   gaze-angled shots is what sells "they're talking to each other".

## Script as a real exchange
Open (A frames the topic) · Introduce (A brings in B by name) · Ask (A turns the
question to B, gaze toward them) · Answer (B responds, gaze back toward A) ·
Follow-up (A asks a natural follow-up, repeat the rhythm) · Close (B delivers the
final line). Alternate lines A/B — not one monologue with reaction shots bolted
on. Split at sentence breaks, one beat per clip.

## Clip rules
- **Every clip fully locked off** — camera movement is the fastest way to break
  this format. No push-ins, pans, zooms, drift. Restate both the character
  identity and the environment (and the banner graphic + its exact text) from
  scratch every clip.
- **Voice lock verbatim per character** — one descriptor, pasted into every clip
  that character speaks in; it drifts by clip 3–4 if unlocked.
- **Split long beats before they rush.** A dense list or long sentence near the
  duration ceiling gets its own second clip — a rushed delivery reads artificial
  faster than almost anything else in this format.

## Disclosure
None (hard rule 14). `"disclosure": false`; no dramatization line is burned in,
stylized testimonial or not, unless the user asks for one in that run. Claims in
the script still have to be true and substantiated.
