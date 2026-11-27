# House Playbook — how these AI UGC ads actually get made

This is the distilled craft from the operator's own production docs (the full
docs are in `references/house-workflows/`). It is **training data**: real,
battle-tested lock language, block structures, and — most valuable — a
troubleshooting log of model failures and the fixes that actually worked.

**When to read this:** before Stage 4 for any live-action or animated-scene
format, and any time a generation comes back broken. The format modules
(`references/formats/`) point here for the shared discipline; the house-workflow
files are the worked examples to pattern-match against.

Everything here is **generic by default** — the docs feature placeholder brands
(Myoguard Pro, Follivé, Driftwell, AgencyOS) and placeholder personas ("Dr.
Sofia R. Marchetti"). Swap in the user's real product/character at Stage 3; never
carry a placeholder into a deliverable.

---

## 1. The pipeline these ads run on

```
reference video / competitor ad
   │  frame-by-frame analysis (Stage 1–2)
   ▼
script  →  reference STILLS  →  video CLIPS  →  ffmpeg assembly (the skill's own)
           (Nanobanana Pro /    (Google Omni /   (tools/assemble.mjs: cut + caption +
            GPT Image 2)         Kling / Seedance) disclosure + end card)
```

- **Stills first, always.** The still is where identity, wardrobe, environment,
  board layout, and on-screen graphic text get locked. Video models are
  unreliable at all of these; the still carries them and the clip inherits them.
- **One reference image per character**, generated once as the anchor (full
  describe, no lock), then every later still `CHARACTER LOCK`s back to it.
- **Clips restate every lock from scratch.** Omni, Seedance, and independent
  Kling clips have no memory between generations. Assume nothing carries.
- **The edit's job is cut + caption + end card only** — no re-cutting, no
  re-timing. Voice, accent, performance, camera, gaze are all locked into the
  generations. **The skill performs that edit itself** with `tools/assemble.mjs`
  (`references/edit-assembly.md`); it is never handed to CapCut or to the user.
  The house-workflow docs below still say "CapCut" — read every such mention as
  the assembly pass.

---

## 2. The lock vocabulary (name them, restate them every clip)

These are labelled blocks in every clip prompt. Write each one once, paste it
verbatim into every clip it applies to. Drift starts around clip 3–4 when a lock
is loosened or reworded.

| Lock | What it pins | Notes |
|---|---|---|
| **QUALITY / FIDELITY LOCK** | the reference image's exact look | "no sharpen, no skin enhance, no beauty filter, no HDR, no cinematic polish, no clarity boost, no colour grade. Raw, organic, true to the reference." State the light temp/colour explicitly. |
| **IDENTITY LOCK** | face, skin tone, hair, build, likeness — per character | `@image1 = exact identity`. One IDENTITY LOCK **per character** in a two-hander (never a merged one). "No de-aging, no slimming, no beautification." |
| **OUTFIT LOCK** | every garment + accessory | Name each piece. "Do not add or remove the glasses / earrings / watch / badge / stethoscope / mic." Accessories vanish first. |
| **ENVIRONMENT LOCK** | every visible object + wall + light + on-screen graphic | "Freeze everything visible in @image1: [list every object with position]." |
| **PRODUCT LOCK** | label text, colours, layout, shape | "matches @image_product exactly … no substitution, no AI-generated label text, no morphing, no drift, label stays fully readable. Movement slow and linear, no spinning." |
| **GAZE LOCK** | eyeline direction + angle | "holds fixed in the exact same direction and angle as in @image — looking [at the co-host / slightly off toward the unseen crowd / at the board], not at the camera — for the entire clip." Also add to negatives. |
| **OPENING FRAME LOCK** | the clip's first frame = the reference still exactly | "The very first frame must match @image exactly — same pose, same gesture position, same body angle, same framing. Do not 'settle into' a different starting pose." Use on short clips and re-used shots where a settle-in wastes runtime or breaks continuity. |
| **SILENCE LOCK** / **HOST SILENCE LOCK** | a visible person who must not speak | Place it right after the scene description (early = the model reads it first). Repeat "mouth stays closed and still, no lip movement, no mouthing" at every performance beat, not once. Add the override: "if the model would normally attach the spoken audio to the on-screen face by default, override that." |
| **VOICE-CONTINUITY FIREWALL** | vocal timbre carries, dialogue content does NOT | When a prior clip is loaded as a voice reference: "Use the previous clip ONLY as a vocal-timbre reference: match accent, pitch, speaking rhythm. Do not reproduce, repeat, or borrow any words, sentences, or dialogue content from it. The dialogue for this clip is exclusively the text in the DIALOGUE block." |
| **COMPOSITION LOCK** | pose + crop + camera framing from a style-reference photo | "match the pose and framing of the style reference exactly … Do not copy the people, wardrobe, or background from it — only the pose, crop, and camera framing." |
| **ROUTE LOCK** | the sequence of background landmarks across a multi-clip walk | Written once as a numbered waypoint list (2–4 named landmarks per clip), restated cumulatively in every clip: "[every waypoint up to and including this one]. Nothing about the location resets, changes brand, changes layout, or changes lighting except the normal forward progress of passing these landmarks." Prevents a chained generator from reinventing the environment leg to leg. `references/formats/walk-and-talk.md` §1. |

**Voice lock is verbatim per speaker, American accent by default (hard rule 17).**
Write the accent + delivery descriptor
once (e.g. "Late-20s woman, warm genuine Southern American accent, soft vowel
drawl, low-mid register, hushed with urgency but clearly enunciated, not
breathy") and paste it byte-for-byte into every clip that speaker talks in.
Never share one block across two speakers. For Kling, the accent goes in **three
places** per clip (dialogue delivery note, performance line, audio spec).

---

## 3. Camera default for scene formats: fully locked off

The phone-UGC selfie default is a tiny natural hand drift. **Every scene format
in the house docs (call-in, broadcast, POV, hot-seat, expert-in-the-moment,
Pixar street interview) overrides that to a completely static camera:**

> "Static [studio / handheld phone] camera, completely locked-off, zero movement
> and zero drift, tripod-still framing throughout. No cuts, no zooms, no whip
> pans, no push-in, no pull-out, no orbit, no pan, no tilt, no handheld drift of
> any kind. The frame does not move. One continuous take."

Camera movement is the single fastest way to break a multi-clip illusion. Two
sanctioned exceptions:

1. A **first/last-frame interpolation** clip where the subject (not the camera)
   moves through a static frame — the camera path is "the patient's own eyes
   tracking her across the room", not a dolly.
2. **`walk-and-talk`**, where the camera moves *with* a walking subject for the
   whole ad on purpose (selfie-POV or a steady follow-cam) — the exception is
   the format's entire premise, not a single clip, and it carries its own
   discipline (ROUTE LOCK, above) to keep the moving background from drifting.
   `references/formats/walk-and-talk.md`.

---

## 4. Reference-image build patterns

- **Build the environment empty first** (two-character broadcast). Generate the
  set with no people; it becomes the environment reference for every character
  still.
- **Anchor → refined anchor.** Generate the anchor, then a tighter/corrected
  version matching the reference's real framing before you build on it.
- **Dual reference for a borrowed pose** (expert-in-the-moment): load a real
  photo as a **Style/Composition reference** (controls pose + crop + framing
  only) *and* the character anchor as the **Character reference** (controls who +
  what the place looks like). Spell out in the prompt which image governs which.
- **Second gaze variant per character** (broadcast): one still looking at camera,
  one with the gaze angled toward where the other character sits — cutting
  between them is what sells "they're talking to each other".
- **Expression / pose set**: for a character who needs multiple states, generate
  one locked still per state (neutral, concerned, laughing; or a low-pointing
  pose for the bottom of a board). Redrawn, not morphed.
- **On-screen graphic → author it as a flat still**, not in the video. A still
  renders text far more reliably. Better still: typeset it as flat HTML/CSS for
  pixel-perfect text, or burn it in the assembly pass (a `banner` / `text`
  block in `assemble.json`). Video-generated text garbles.
- **Match the clip prompt to the ACTUAL generated still**, not to what you
  intended. If the still came back with the nurse's back to the door and a
  monitor reading "109", the Omni prompt describes exactly that.
- **Duplicate stills for repeat generations** (see §6, the biggest lesson).

---

## 5. Script & performance craft

- **Per-line performance beats.** Under each spoken line, an em-dash note giving
  the expression / gesture / head move / pause for that line. The other
  character's silent reaction goes in parentheses.
- **Physical mechanics over abstract instructions.** Not "the battery drains" —
  "draw a horizontal battery outline, shade the interior solid black, then wipe
  the black away from the right side with her fingertip to about half full; all
  shading stays inside the outline." Not "she reveals the product" — "she reaches
  off-frame to her side, picks it up off an unseen bedside table, brings it back
  into frame beside her face, label to camera."
- **Numbers spoken as words in dialogue** ("fourteen thousand dollars",
  "eighty-plus vitamins"), correct spelling only in the burned caption.
- **Pronunciation notes** for anything the model will mangle: "GLP-1 = G-L-P-one,
  hard P like 'pea', never a V sound." "Ca-HMB = C-A, H-M-B, separate letters."
  Put it in the dialogue lock *and* as a standalone note.
- **Accent written into the script** where it carries the voice: glottal stops
  spelled out ("that's" → "tha's", "don't" → "don'") for MLE/Estuary; "en't"
  for "hasn't".
- **Time budget per action.** Each write / draw / prop action needs roughly its
  natural real duration. A line truncates or appears early when it's crammed into
  a ~2s beat alongside three other actions. The fix is more time, not more words.
- **One emotional spike.** Most of the read is flat and fast (reads as honest);
  one genuine break — a laugh, an "I cried", a stare — carries the feeling.
- **Emotional arc across a character's clips.** The hot-seat crowd member: nervy
  pride → frustration → genuine curiosity → quiet realisation. Name the shift.

---

## 6. Troubleshooting log — model failure → the fix that worked

Ordered roughly by how often it bites. When a generation breaks, find the row.

### Copy (the failure that costs the most and looks the least broken)

| Symptom | Fix |
|---|---|
| The script is clean, on-structure, blacklist-clean — and completely forgettable | You wrote it from a brief. Models write generic copy cold and good copy when copying a close example. Get the competitor transcript verbatim, or a swipe the operator likes, or one of their past winners, and adjust *that* line by line. If there is no example, ask for one instead of free-writing. |
| The hooks are all safe / all the same door in | Hooks and visual hooks are the operator's job, not the model's. Ask what they have first, use it verbatim if they give one, and present your five as options to pick apart — never as the finished call. |
| Copy comes back hedged, softened, or carrying a disclaimer nobody asked for | The model volunteered a compliance edit. Don't — ignore compliance red flags entirely (SKILL.md hard rules 14 and 22). No hedges, no disclaimers, no caveats, no **Open flags** legal line, no note in the delivery. The operator has the guidance and owns the call. Write the claim as asked; if they push back on a caveat, remove it. |

### Identity / consistency

| Symptom | Fix |
|---|---|
| Face / wardrobe drifts by clip 3–4 | Every clip restates the full IDENTITY + OUTFIT LOCK verbatim, and each later still CHARACTER LOCKs to the anchor. Text alone tops ~80%; the reference image + explicit lock closes it. |
| Voice becomes a different person across clips | Paste the voice descriptor byte-for-byte in every clip. One block per speaker, never shared. Kling: accent in 3 places per clip. |
| A later clip repeats lines already spoken in an earlier clip | The video reference loaded for voice-matching bleeds **dialogue content**, not just timbre. Add the VOICE-CONTINUITY FIREWALL block. |
| A reference image keeps influencing a clip even after you removed it from the prompt text | It's still attached in the platform's upload panel. Physically remove it, not just the text mention. |
| Content from a "style only" reference still leaks in (words appear before they're drawn, elements you didn't ask for) | The model pulls the reference's **actual content**, not just its style. Drop that image from the clip; describe the style in text, or use first/last-frame anchoring instead. |

### Repeat-generation content blocks (Google Flow / Omni)

| Symptom | Fix |
|---|---|
| One clip repeatedly fails content review while other clips with the same characters/setting pass | The platform applies **extra scrutiny to repeat video-generation requests anchored to the same reference image/identity**. Regenerate a **fresh, visually near-identical duplicate still** and anchor the clip to that instead of re-using one image file across multiple generations. This is the single highest-yield fix. Going forward: every clip that reuses a pose gets its own duplicate still (Frame A′, etc.). |
| Omni refuses citing "reputational risk" / brand safety | A distinct classifier from violence/sexual filters. Triggered by clinical/mechanism health language ("calms your nervous system", "fight or flight", "resets X") + an authoritative figure endorsing a named product = reads as undisclosed advertising / authority impersonation / unverified health claims. Fix: strip clinical mechanism language → plain wording ("helps your body wind down"). Remove genre-signalling words from the prompt text ("on-air", "radio show", "call-in", "live", "caller") while keeping the visual concept (headset, desk, a voice through an audio feed). Drop invented props not in the real reference. Other levers: test one clip in isolation to find the trip; try a different surface (Gemini app / Google Flow / API); loosen the configurable safety threshold on API/Vertex; check for a regional restriction; file a false-positive report once softened. |
| A beat where one person turns to directly challenge / taunt another (or a baby, a child) trips review | Restructure to **third-person narration** facing camera ("She knows exactly what she's doing") instead of second-person confrontation ("You reckon you could…"). |

### Camera / framing

| Symptom | Fix |
|---|---|
| Whiteboard/blackboard text reads tilted (keystoning) | The board is at a three-quarter angle. Instruct the camera to sit **perpendicular to the board's surface** — "board reads as a true flat rectangle, all four edges parallel to the frame" — not just "facing the scene". |
| Camera adds an unrequested push-in / drift and breaks the cut-to-cut illusion | The full locked-off block from §3, in every clip, plus "the frame does not move" in the negatives. |
| A re-used shot "settles into" a slightly different pose at the start, breaking continuity | OPENING FRAME LOCK. |
| Background people move / react distractingly | "Seated attendees stay exactly as positioned in @image for the entire clip — same poses, no independent movement, no shifting, no new gestures. Static background, not performing." Add to negatives. |

### Performance / audio

| Symptom | Fix |
|---|---|
| A visible person speaks when they should be silently listening | Omni lip-syncs any dialogue-shaped audio to any visible face. Add a SILENCE LOCK early in the prompt, repeat it at every beat, and add the "override the default audio-to-face attachment" line. For a fully silent cutaway also state "generate with no native audio track". |
| Subdued / whispered line comes out loud and upbeat | Kling bias — it ignores "whisper/murmur/soft". Plan an ElevenLabs audio replacement, or rewrite for an energetic read. Omni and Seedance handle subdued fine. |
| **The read is too slow** — a 165-word script generates ~80 s at the default clip timing and a 45 s source becomes a 75 s ad | H3 fills whatever clip length it is given, so the clip length *is* the speaking rate. Measured 2026-09-12 (same portrait, same seed, 22-word chunk): 0.4 w + 1.5 s → last word at 10.8 s (2.0 w/s); 0.3 w + 1.0 s with a "talking fast, a quick brisk sales-pitch pace with no pauses between sentences, every word still clearly enunciated" line → last word at 7.3 s (3.0 w/s), every word intact, and then 21/21 chain clips complete at that timing. `tools/talking-head-chain.sh --spw 0.3 --slack 1.0 --pace "…"`. Probe one chunk both ways and transcribe before committing a chain; below ~0.3 w/word words start dropping. |
| You need a seed portrait for a chain and only have a still | A Nanobanana still prompted "lips closed, eyes to lens, slight asymmetric closed-lip smile" seeds the `i2v` chain directly — identity, wardrobe, room and framing held across seven clips in three separate chains (2026-09-12). The establishing `t2v` clip is only needed when no clean closed-lip still exists. |
| A stylised format (Pixar, LEGO, cut-paper, flat 2D) needs a chain, and the Evolink client cannot chain (no local start frames) | **Adsora Gen holds the style from the still.** Probed 2026-09-12 ($0.16): a Pixar contractor still spoke a 22-word line in style with cartoon lip-sync; a LEGO minifig lowered a tile in ratchet steps with the printed face fixed; a cut-paper plank slid in and lay across the torn strips exactly as briefed. `tools/chain.sh` (one full prompt per line, last-frame chaining, one seed) ran seven-clip narrator chains and five-clip silent chains at ~$0.55 / ~$0.40 each. Silent chains take the Kokoro read underneath in assembly (`assemble-vo-stylised` pattern: one concatenated chain, `audio` + `script`). |
| A short reaction line (2–5 words) comes back as a slow five-second read | H3's floor is 5.2 s and it stretches the line to fill it; there is no trailing silence to trim (the room tone runs to the end, so silencedetect finds nothing). Measure the real speech with an RMS envelope (`tools/speech-end.py`: floor = 20th percentile, speech = +12 dB) and cut `in` / `seconds` to it. Expect two-speaker verbatim ads to run 80–85 s for a 165-word script. |
| A generated still is refused for third-party content rights (nano-banana) even after redesign | The classifier keys on the *description shape* (a rounded balding cartoon man with an overbite and a blue shirt reads as a famous cartoon, and so did the redesign with glasses and a moustache). It is also flaky between near-identical prompts: of three redesigned stills one passed. Reuse the passing still and prompt the expression change in the clip instead of re-rolling the still. |
| A clip opens with a garbled preamble ("you to the Persian Indian Town, this beautiful…") or a silent clip comes back talking | Any dialogue-shaped phrase in the *scene* sentence is read aloud too, not only a label before the quote. Measured 2026-09-12 (POV chain): the scene line "speaking directly to the viewer's eyes and saying you to the person the camera is" leaked as a spoken "you to the…" preamble on four of five clips; a "no speech" entrance clip still produced a garbled line. Keep scene sentences free of second-person and speech-like words; for a silent clip, mute it in the edit rather than trusting the instruction. Repair without re-rolling: `tools/words.sh` finds the first real word and the clip takes `in` = that start − 0.15 s. |
| Dialogue doubles / stutters | A dialogue word is echoed somewhere outside the quoted line. Words live ONLY in the DIALOGUE block; reference beats by position ("the payoff phrase near the end"), never by quoting them. |
| **Every clip opens by speaking the prompt's own framing words** ("They say...", or a garbled version of a label) | Whatever text sits between the scene description and the quoted line can be read aloud as part of the speech, and the longer that text is the more reliably it happens. Measured on Adsora Gen H3, `i2v`, 2026-09-12, same portrait and seed, only the introducing phrase changed: `They say: "..."` leaked on all six clips of a chain · `SPOKEN LINE, lip-synced, exactly these words and nothing else: "..."` leaked worse, the label itself came out garbled ("That's Kowei to everything the likes") · `He says: "..."` came back clean · a **bare quoted line with no introduction at all** came back clean. Fix: introduce the line with nothing, or at most a two-word third-person-singular narration verb. Never a label, never "they say", and never add a "do not speak anything else" instruction — that is more text to read out. `tools/talking-head-chain.sh` now emits the bare quoted line. **Transcribe the first clip of any chain before generating the rest** — two wasted clips cost more than one check. |hanical constraints in one prompt competing with clean dialogue delivery. **Escalating specificity backfires.** Revert to simpler language, state each rule once, give more time per beat. If still too dense, **split the clip into two shorter clips** — that's the next lever, not more rules. |
| A planned gesture (a circle, a pointer move) lands in the wrong clip after a dialogue re-split | Re-check which beat owns which action when you re-cut; an action can get duplicated across two clips. |

### Accent, identity and the edit (measured 2026-09-12; enforced by `tools/qa.mjs`)

| Symptom | Fix |
|---|---|
| **A voice comes back British although every prompt says "American accent"** | The **start frame** set the accent, not the voice line. British words in the still prompts ("pavement", "car park", "flat cap", "shopfront", "building site") drew a UK high street, and Adsora Gen i2v voiced the place it saw. Across 22 clips: bare "General American" held 7/7 on an American frame and **lost 3/3 on the British one**; a named region ("Upper-Midwest", "Southern") held **every** time on both. Fix: American words in every still (`tools/qa-dialect.json`), an American locale anchor on exteriors, and a **different named US region per speaker**. Never "mid-Atlantic" — it is the transatlantic, half-British accent and came back British. Detection: `qa.mjs clips` runs a local CommonAccent classifier (`tools/accent_check.py`); calibrated gap of 0.60 between the worst American clip (+0.33) and the best British one (−0.27). |
| Three stills of "the same" interviewer give three different women; a mic turns white | Each still was generated from text alone. Re-describing a person, however precisely, produces a cousin. Pass the first still as `image_urls` on every later still of that person. `qa.mjs lint` (IDENTITY) catches two stills that share 2+ distinctive traits with no reference. |
| **A drama plays the wrong line** in a shot, clips words ("Overcarter"), or cuts a punchline in half | The takes each held 2–4 lines and the edit sliced them on whisper word timings. A guessed slice point inside a multi-line take can land on the neighbouring line. Fix: **one spoken line per clip**, trimmed to its own speech; reactions as separate mouth-closed clips (`production-discipline.md` §14). `qa.mjs` fails it at lint (LINE-COUNT) and at final (SLICED-TAKE, MICRO-CUT, MISMATCH). |
| A two- or three-word line is spoken twice ("Over the old floor? Over the old floor?"), or a clip opens with garbled words ("The Kimmel Grap NNF Fruits now…") before the line | The clip's minimum length (Adsora Gen 5.2 s, Seedance 4 s) is longer than the line, so the model fills it; the garbled lead-in is the same H3 habit at the other end. Both are routine, not re-rolls: `qa.mjs trim` cuts to the first complete reading using the pauses in the audio. Do not trim from whisper word timings — on a repeat they collapse the second reading into zero time at the end, so the "end of the line" lands at the end of the clip. |

### Dialogue scenes that pass every correctness check and still play badly (measured 2026-09-12)

| Symptom | Fix |
|---|---|
| **Each character sounds like a different person from line to line** | Every separately generated clip gets a new voice from the text description. Carl's 19 lines: median speaker similarity 0.28 (a real person scores 0.42–0.53; four lines inside one take scored 0.41). Re-voice every line to one reference per character with `tools/voice_unify.py` (Chatterbox VC, timing kept within 20 ms, afterwards 0.60–0.70). `qa.mjs final` (VOICE-DRIFT). |
| **The volume jumps at nearly every cut; the background hiss changes under the edit** | Each clip comes out of the model at its own level with its own room tone: 19.5 dB of spread in speech level, 26 of 45 cuts jumping more than 4 dB, room tone spread 16 dB. Level every line to one speech loudness and lay one continuous room-tone bed (`voice_unify.py` does both). `qa.mjs final` (LOUDNESS, ROOM-TONE). |
| **An argument drags** | Trims padded from the first *sound* (a breath up to 1.4 s before the word) and a 0.25 s tail gave a 0.65 s median pause and pauses up to 2 s. `qa.mjs trim` now lands on the first word and keeps a 0.15 s tail. `qa.mjs final` (PACING). |
| **The two people in a conversation never look at each other** | Their close-ups were generated separately and both look screen-right; one also contradicts the wide, so cutting from the wide flips his side of the table. Generate every single with the wide as environment reference and an eyeline taken from the wide's geography; people who talk to each other look in opposite directions (`formats/drama.md`). |
| **An extra person's shoulder sits in the foreground of two characters' close-ups** | The image model invents an over-the-shoulder figure for "a close-up of someone talking to someone across the table". Nobody in the cast is that person. State "only this one person is in the frame, no shoulder, arm or back of anyone else", and look at the singles before any clip is generated. |
| **Regenerating stills from an old anchor copies the old composition — flaws included** | The reference image dominates framing, not just identity. Say "use reference image 1 ONLY for the face, hair and clothes; do not copy its framing, pose, background or anyone else in it". |
| **A templating script pastes a character's old description beside the new one** | The model gets two rooms and two outfits to reconcile. `qa.mjs lint` (PROMPT-DUP) fails any prompt that repeats a long sentence. |
| **Every subtitle changes a beat before its shot; the picture stutters at each cut** (measured 2026-09-13) | Not the clips: `assemble.mjs` cut segments that were not whole frames with AAC audio inside, so each segment's audio decoded ~20 ms longer than its video. The concat advanced by the audio, leaving a video gap at every cut, and the picture slid ~7 ms per cut behind the caption timeline — 0.33 s late after 47 cuts. Segments are now frame-exact with PCM audio; cuts land within 5 ms. `qa.mjs final` (CUT-DRIFT) matches detected shot changes to the timeline. |
| **Once the pauses are fixed, the scene plays like a metronome** | Cutting every dry line to its speech (`voice_unify.py` `tighten`) put all 46 cuts at 0.21 s. That is right for a volley ("No." / "Laminate." / "No.") and flat everywhere the script turns. Add held beats with `holds` (0.35–0.6 s) where a new character walks in, a number lands, a claim needs a reaction, and before the button line. A hold sits on the next speaker's silent face when its native audio shows a still mouth, else on the previous speaker's tail. |
| **A lone word flashes as its own subtitle** ("It'll be up in a" / "year.") | Greedy caption filling. `captions.mjs` now splits each sentence into the fewest balanced cards and never ends a card on "a", "the", "for" and the like. |
| **A subtitle is printed across a graphic's own text** (the approval screen) | Set `"captionY"` on that cutaway (0.86 cleared the card). `qa.mjs final` (CAPTION-COLLISION) measures the caption band on every still cutaway. |
| **A reaction cutaway hides the punchline** | A tail cutaway laid over a 1.5 s line covered half of "Do mine first.", the moment the skeptic caves. Put reaction cutaways over long lines or silent holds, never over the turn of the scene. |
| **A character with only short lines is never checked** | The voice check skipped anyone with fewer than three lines of 0.8 s+ speech (Rob, 8 lines). It now falls back to 0.4 s+ lines, warns when a speaker still can't be measured, and fails two characters who sound alike (VOICE-CONFUSION; different characters measured 0.04–0.26). |

### Props / product

| Symptom | Fix |
|---|---|
| Product label morphs / invents text / changes colour | PRODUCT LOCK with the exact label text written out, product image loaded as a Visual Reference, "no AI-generated label text", slow linear movement only. |
| Product duplicates back onto a surface after being handed off; a door opens with no cause | Wording fixes fail here — **structural rewrite of the beat**. The product physically exits frame and "must not reappear anywhere — not on the table, not in her hand, not anywhere". The door "never opens at all — no handle sound, no latch sound, no movement of any kind"; the clip ends before contact. |
| Product appears to come from the character's own body/pocket when it shouldn't | Have it originate from an off-frame surface; negative: "no reaching motion that looks like it's coming from her own body or pocket." |
| A "before/after split-screen" comes out as a weird in-frame composite | Don't ask the video model for an edit-layer effect: "Do not generate a split-screen before/after inside [model] — that is an edit-layer cut." Do it in the assembly pass (a `split` clip in `assemble.json`). |
| Wrong opening reference image → content appears undrawn / out of sequence | Confirm which image is set as the opening frame for that clip. |

### Whiteboard / drawn-explainer specific

| Symptom | Fix |
|---|---|
| Text/icons appear on the board before the hand draws them; a word gets written twice | "Complete and only" content lists per clip (start state + end state, "nothing else appears, ever"), stroke-by-stroke language ("nothing appears before her hand draws it"), and drop any filled-board style reference from later clips — its content bleeds. |
| Constant eye contact with camera while writing looks unnatural | GAZE RULE: eyes on the board for the full duration of every stroke; brief glances to camera only *between* strokes. |
| Written content doesn't match the spoken timing | Rewrite the clip with precise sub-clip timestamps synced to the exact phrase ("00:00–1.7s: writes 'ON A GLP-1?' … Speech: 'If you're on a GLP-1,'"; "timed so the word 'MUSCLE' is on the board right as she says it"). |
| An icon (e.g. a bicep) gets shaded/altered when a nearby icon (a battery) is being worked on | Anchor the action "inside the [battery] outline only", plus a standalone line: "the [bicep] icon is not touched, shaded, filled, or altered at any point." |
| Pointer / stick points at empty space or the wrong word | STICK-TARGET RULE: point only at the specific named element using an explicit **relative spatial anchor** ("one text-line below X, same left margin"), never "the empty space below X". The stick leads each new word into existence at its tip. |
| Even with spatial anchors, the pointer stays at mid-board when the target is low | **A visual pose-reference image beats a written spatial description.** Generate a low-pointing pose still and instruct the model to match that pose exactly for those beats. Strongest single lesson from the pointer workflow. |
| Elements glow that shouldn't (glow read as a dynamic "relevant now" highlight) | GLOW RULE: the glow is a permanent fixed property of specific icons only, never pulses/moves/transfers, nothing else ever glows; the only relevance indicator is the pointer. |
| Chalk/marker colour switches back and forth within a clip and looks fake | One colour used for all its elements in one continuous pass, set down, then the next colour picked up — never switched back, never picked up again. |
| Chalk wipe transition takes too long / lags | The dead beat is a **static shot of the finished board before the wipe**. Open the clip already mid-wipe (a "dusting-in-progress" frame: hand mid-arc, motion-blurred marks, fresh smudge streaks, chalk dust in the air). |
| Chained board state gets reinterpreted/redrawn | Board content carried via a final-frame reference must be declared "exactly as in [image], not touched, not redrawn, not resized, not moved". |
| A board-only last-frame anchor contradicts a product reveal in the same clip | Either generate one true last frame with both the finished board and the product in hand, or drop the last-frame anchor for that clip and describe the ending in the timestep text with plain style + product references. |

---

## 7. Compliance & the edit (never skipped, never left to the model, never handed to CapCut)

- **Who does the edit: the skill.** Every item below is executed by
  `tools/assemble.mjs` in Stage 5 (`references/edit-assembly.md`). None of it
  is ever described to the user as a CapCut to-do.
- **No disclaimer.** House rule (SKILL.md hard rule 14): no dramatization,
  actor-portrayal, results-vary or category legal line is burned into any
  final, stylized testimonial or not. `"disclosure": false` in every assembly
  file. The house-workflow logs linked below predate this rule; read their
  "burn in the disclosure" steps as superseded. If the user asks for a line in
  a given run, burn in their wording in the edit (never generated natively,
  models garble text) and say so in the delivery note.
- **Original characters only.** Never reproduce a real, identifiable person's
  face, name, voice, or specific identifying details from a reference video —
  match staging, pacing, camera style and general energy only. State this in the
  still prompt: "this is a different, fictional person — do not reproduce the
  real individual's likeness from the reference."
- **Compliance is the operator's, entirely — you ignore it.** The workflow is
  production technique. Any product claim, credential, or endorsement is the
  operator's call to make and substantiate, and they already have the guidance.
  Do not flag an unverified claim, soften it, hedge it, add a disclaimer, or
  decline a hook because the category is regulated — not in the script, not in
  **Open flags**, not in the delivery note (SKILL.md hard rules 14 and 22). What
  still binds you is the next bullet — original characters only — and the Stage 3
  rule against inventing product facts the operator never gave you.
- **Captions**: bold sans-serif, karaoke-style word highlight, centered
  lower-third, inside the platform safe zone, 2–4 words on screen at a time
  synced to speech. Reads as real event/UGC captions, not ad subtitles.
- **Cuts**: hard cuts only between clips, no crossfades or dissolves — that's
  what sells a fast pace when no single clip has camera movement.
- **End card**: often text-only, no VO, with a comment-bait CTA ("Comment 'X'
  for how it works").
- **Audio repair**: if a native VO comes back mangled, don't re-roll the video —
  transcribe, regenerate the line in ElevenLabs with emotion tags, and in the
  assembly pass swap it in (`audio` on that clip, `ambience` to keep the room
  tone under it). The skill does this swap, not the user.

---

## 8. Index — house-workflow files and what each one teaches

| File | Format | Engine | Standout lessons |
|---|---|---|---|
| `house-workflows/call-in-advice-show.md` | host takes a "live call", caller heard not shown | Nanobanana → Omni | HOST SILENCE LOCK; brand-safety softening (strip clinical language + genre words); voice as a specific regional drawl locked across clips |
| `house-workflows/two-character-broadcast.md` | anchor + expert guest interview | any image → any video | build the empty set first; independent character locks; gaze-variant stills; banner graphic authored as a still; split long beats before they rush |
| `house-workflows/yapping-talking-head.md` | single-person direct-to-camera rant | Nanobanana → Omni | green-screen (#00B140) for keyed backgrounds; one reference image reused as the start frame for every clip; per-beat hand-gesture choreography; Notes-app title card; median-stack compositing to read text off a source |
| `house-workflows/talking-whiteboard-actor.md` | actor at a whiteboard, writing while lip-synced | GPT Image 2 → Seedance 2.5 | perpendicular-camera keystoning fix; GAZE RULE; VOICE-CONTINUITY FIREWALL; board start/end state lists; sub-clip timestamps synced to phrase; first/last-frame anchoring; time-budget per write action |
| `house-workflows/pixar-whiteboard-pointer.md` | chibi-Pixar presenter, progressive reveal with a pointer stick | image model → Seedance 2.5 | STICK-TARGET RULE + relative spatial anchors; **pose-reference image beats written spatial description**; GLOW RULE; pronunciation notes; last-frame anchor vs product-reveal contradiction |
| `house-workflows/blackboard-chalk-hand-only.md` | hand-only chalk on blackboard, off-camera VO | image model → Seedance 2.5 | 3-colour one-pass-per-colour rule; partial wipe with ghost-smudge; open the clip mid-wipe to kill lag; **escalating specificity backfires → simplify or split**; no disclosure needed (no face/credential) |
| `house-workflows/pixar-street-interview.md` | two animal characters, eager vs deadpan, vox-pop staging | Nanobanana → Omni | single locked frame for the whole video; characters make eye contact with each other, never camera; separate IDENTITY LOCK per character; product from a coat pocket as the one gesture; hard cuts sell the pace |
| `house-workflows/pov-first-person-scene.md` | POV from the viewer's own eyes (patient in a bed) | Nanobanana start/end → Omni | POV camera = the viewer's eyes, static; first/last-frame interpolation for the entrance; match the prompt to the actual generated stills; reverse-approach exit; product-duplication structural rewrite; DISRUPT "declassify the secret" device |
| `house-workflows/hot-seat-crowd-qa.md` | live-event crowd member + coach on stage | Nanobanana → Omni | two anchors + two backgrounds; GAZE LOCK on the coach; OPENING FRAME LOCK + static-background on re-used crowd shots; silent listening cutaway (no native audio); specificity over polish ($14K in 90 days); comment-bait end card |
| `house-workflows/expert-caught-in-moment.md` | trusted expert notices a problem mid-service and recommends | Nanobanana → Omni (+ GPT Image 2 recreations) | PAS via a third-party expert; dual reference (pose photo + character anchor) with COMPOSITION LOCK; one prop action per clip; mouth-closed lock for the non-speaker; "don't generate a split-screen inside the video model"; scene-extension chain for continuity |
| `house-workflows/comedy-two-hander-ugc.md` | comedic narration over a second (passive) character | Nanobanana → Omni (+ Kling alt) | clone a reference video's staging/energy without its people or script; ignore scraper-spam filenames; 1-fps frame review; **duplicate still per repeat generation** to pass content review; restructure confrontational beats to third-person narration; accent spelled phonetically into the script |
