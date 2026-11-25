# Format Module — Drama (a scripted conflict scene the product resolves)

A short scene, not an ad. It opens mid-argument, escalates, and holds the viewer
on an unresolved question for a minute or more. The product is the answer to
that question, and it is dragged out of the character who uses it by a
**skeptic under pressure**. Nobody pitches. Every persuasion job — the
before/after, the competitor dismissal, the price anchor, the claims, the
scarcity, the guarantee, the CTA — is disguised as a line of plot.

Two production variants share one skeleton:

| | **A. Cinematic scene** | **B. Caught on a phone** |
|---|---|---|
| Looks like | a scene from a TV drama | someone filming a confrontation they're part of |
| Camera | locked off, film look, shot / reverse-shot | handheld phone POV, the filmer is a character |
| Setting | one interior with fixed geography (a service counter, an office, a clinic desk) | a doorstep, a driveway, a parking lot |
| Cast | 3–4 on screen | 2 on screen + the filmer's voice (+ an agent on speakerphone) |
| Where the product appears | handed across the scene, label read aloud | the funnel on the filmer's phone, held into frame; an in-scene call confirms the result |
| Video engine | **Seedance 2.0** one-line clips, each trimmed to its own speech | **Seedance 2.0**, or **Seedance 2.5** for a one-take over 15s; phone screens **captured** |

**Engine: Seedance, not Adsora Gen.** Drama is not in the face-UGC routing.
Every generated clip in this format goes through Evolink Seedance 2.0 or 2.5
(`references/model-specs.md` → Seedance, `references/generation-adapters.md`).

**House references:** variant A — a cinematic counter-scene skincare ad
(177s, 76 cuts, 3 locked characters, one location). Its reference skeleton is
at the end of this file; the source and its timed transcript live in
`~/Documents/Adsora/Research/x/skincare/`. Variant B — the eviction doorstep ad
in the swipe library's `ACA` folder (197s).

**Runtime: 90–200 seconds.** Like `funnel-walkthrough`, this format is exempt
from the 20–45s band. The retention engine is the unresolved conflict, and it
needs room to escalate.

---

## When this format fits the DNA

- **The result is visible or provable by a prop** — a face that no longer
  matches an ID photo, a past-due notice that gets paid, a quote that gets
  beaten. The prop becomes the plot's problem.
- **The category has a long list of failed alternatives** the prospect has
  already tried. A skeptic can list them out loud and have each one rejected.
- **The claim is hard to say without sounding like an ad.** Put it in a
  doubter's mouth instead.
- **The competitor ad is a drama.** Transplant the conflict engine; change the
  setting, the prop and the product.

Skip it when the product has no visible result and no stakes a stranger would
argue about, or when the offer only works as a fast single-claim hook
(`dance-big-text`, `ugc-yapper`).

---

## The skeleton (both variants)

| # | Beat | Persuasion job it is secretly doing | Variant A shape | Variant B shape |
|---|---|---|---|---|
| 1 | **In medias res** (0–5s) | Hook. Open conflict, no setup, no establishing shot. First line is a refusal or an accusation. | an official refuses the hero's document | an officer / landlord at the door with a notice |
| 2 | **The impossible evidence** | Before/after, or the stakes, dressed as a problem. | the hero's own ID photo no longer matches her face | the exact amount owed, read off the notice |
| 3 | **Escalation to authority** | Raises stakes; adds a second skeptic as witness. | the hero demands a supervisor; one arrives | the tenant pleads; the filmer steps in |
| 4 | **The interrogation ladder** | Competitive disqualification. Every alternative the prospect tried is named by a skeptic and rejected by the hero. | the skeptics name each treatment in turn; the hero rejects every one | the authority names the usual options; each one already failed |
| 5 | **The withheld reveal** | Curiosity loop that carries the middle third. The hero trades the answer for what they came for. | the hero offers the answer only once the skeptic signs off | the filmer asks for two minutes to fix it |
| 6 | **Third-party desire** | Social proof + price anchor, from a bystander. | a skeptic admits a relative spends a lot on alternatives | the officer admits he's seen this go wrong before |
| 7 | **The trade** | Payoff of the loop; the conflict resolves in the hero's favour. A mostly silent beat. | the stamp comes down | the funnel runs on the phone in frame |
| 8 | **Reveal from the skeptic's mouth** | Mechanism + claims, delivered by the converted doubter, never the seller. | the product slides across; the skeptic reads the benefits off the label | a speakerphone agent confirms the approved dollar figure |
| 9 | **Scarcity + transfer + second convert** | Urgency, a second conversion, and the CTA spoken *inside* the scene. | online-only / often sold out → the hero hands it over → a bystander asks for one → is told where to buy | the filmer tells the tenant anyone can do this from a phone |
| 10 | **Risk reversal** | Objection handle, in character. | a character mentions the guarantee | the filmer points out it cost nothing to check |
| 11 | **Hero shot + name + callback + CTA** (last 6–10s) | Brand + CTA. The closing line calls back to beat 2. An exit beat may come first. | product on the counter; a callback to the evidence prop; the shop CTA | the approval screen held; the check-yours CTA |

Beats 4, 5 and 8 are the format. If a rebuild loses the ladder, the withheld
reveal, or the skeptic-reads-the-claims move, it has become a testimonial with
extra actors.

---

## Cast and locks

- **Cast by persuasion role, not by character type.** The roles are **hero**
  (has the result, withholds it), **skeptic** (voices the viewer's doubts,
  converts), **authority** (raises stakes, converts or stands down) and
  **bystander** (price anchor, asks for one too). Three characters can cover all
  four: in the reference, the authority also delivers the price anchor, and the
  skeptic becomes the second convert. Four characters maximum.
- **One reference image per character, reused in every take.** Seedance has no
  labelled lock blocks — its prompts are pure prose. The lock is a
  **reference pack** pasted identically into every take of the project, each
  image's job named in words: `@Image 1` the empty set and its light, `@Image 2`
  the hero, `@Image 3` the skeptic, `@Image 4` the authority, `@Image 5` the
  product (post-reveal takes only). Unlabelled references get blended.
- **Each character's identity, outfit and voice are written as prose sentences
  and pasted byte-for-byte** into every take they appear in — the same words
  every time (`production-discipline.md` §4–§5). One voice description per
  speaker, never shared.
- **Separate every character by wardrobe colour and silhouette** so a
  two-second cut reads at a glance — one dark neutral, one jewel tone, one
  structured jacket. Wardrobe never changes and never repeats between
  characters.
- **The hero is visibly the target age *and* visibly the result.** The
  generated face is the "after". The evidence prop (beat 2) is the "before",
  generated from the same identity anchor with the problem added.
- **Fixed geography.** Build the empty set still first
  (`house-workflows/two-character-broadcast.md`) and write down who stands on
  which side of the counter / door and where the light comes from. Every
  coverage still is built against that.
- **The product is invisible until beat 8.** `@Image 5` is left out of every
  pre-reveal take, and those takes carry "the product does not appear anywhere
  in frame" in their `constraints:` clause. A product visible at 0:40 kills the
  loop.
- **Invented names, invented IDs, invented addresses** on every prop and in
  every line. No real person's likeness (hard rule 22).

---

## Shot grammar

### Variant A — one line per clip, cut on clip boundaries

The reference cuts every 2–3 seconds. Get that pace from **short one-line clips
trimmed to their own speech**, never by carving several lines out of one long
take.

> **Superseded method — do not use.** This module used to say "generate coverage
> takes that hold two to four lines each, then read whisper word timings and cut
> the shots out". Built that way on 2026-09-12, the pop-on flooring drama shipped
> with **the wrong line in two shots** (a character's "It's been two" never
> played; "over the carpet" played twice in its place), **clipped words**
> ("Overcarter", "Now." for "No."), **a destroyed punchline** ("Do mine after"
> cut to "Do mine"), 10 takes sliced into 3–4 pieces each and five sub-second
> slivers. A slice point guessed from word timings inside a multi-line take can
> land on the wrong line, and there is nothing to check it against.
> `tools/qa.mjs` now fails that construction at every gate (LINE-COUNT,
> SLICED-TAKE, MICRO-CUT, MISMATCH).

- **One clip = one spoken line = one speaking face = one camera angle.** A
  line is one quoted string in one prompt. Two lines are two clips, even for
  the same character on the same angle.
- **Trim inside a clip, never slice across lines.** Each clip has exactly one
  line in it, so its trim is unambiguous: `node tools/qa.mjs trim clips.json`
  cuts every clip to its first complete reading and writes `trims.json`. A wrong-line
  cut becomes impossible, because there is no other line in the file to land on.
- **Short lines repeat to fill the clip.** Adsora Gen has a 5.2 s floor and
  Seedance a 4 s one; a two-word line ("Per area?") gets spoken twice to fill
  it. Trim to the **first** reading. `qa.mjs clips` flags every clip where the
  line was heard twice, so the trim is never missed.
- **Reactions are their own clips.** Generate a 4–5 s mouth-closed listening
  clip per character per location, with the SILENCE LOCK and "generate with no
  native audio track", and lay 1–2 s of it over the other character's line. Do
  not harvest reactions from the pauses inside a speaking take.
- **Budget by lines, not by seconds.** A 60-line scene is 60 speaking clips plus
  one listening clip per character per location. It costs more generations and
  each one is short and cheap; that is the trade that buys a correct edit.
- **One voice per character: re-voice every line after generation.** One line per
  clip means each line is a separate generation, and the video model invents a fresh
  voice for each one. Measured 2026-09-12, a character's 19 lines scored a median
  speaker similarity of 0.28 against each other (one real person scores 0.42–0.53):
  a different man every line. Pick each character's most typical line as the
  reference (`tools/audio_check.py pick-ref`), then `tools/voice_unify.py` converts
  every line to it with Chatterbox VC. Timing is kept to within 20 ms, so lip-sync
  and the acting survive, and the lines scored 0.60–0.70 afterwards. The same pass
  levels every line to one speech loudness. Its optional `bed` lays one continuous
  room tone (and the music) under the scene. Put each converted line on its clip as
  `"audio"`, and each clip's `"speaker"`, so `qa.mjs final` can check voice, loudness,
  room tone and pacing.
- **Pace the scene in the voice pass: tighten, then put the beats back.** Native clips
  leave 0.3–0.6 s of air round each line; cut straight, the 2026-09-13 drama ran
  0.41 s median and 1.12 s worst between speakers and dragged. `"tighten"` in
  `unify.json` cuts every dry line to its own speech (0.08 s lead, 0.12 s tail) and
  hands the edit its new `in`/`seconds` through `unify-manifest.json`. Every cut then
  sits at ~0.2 s, which plays a volley well and every turn of the scene like a
  metronome. So name the beats in `"holds"`, each a pause *before* a line
  (0.35–0.6 s): a character walks in, a number lands ("Fourteen."), a reveal needs a
  reaction, and the button before the last line. The tool puts each hold on the next
  speaker's silent face, or on the previous speaker's tail, only where the clip's
  own audio shows a still mouth. Change holds with `--holds-only` (no reconversion).
  Re-voice one bad line with `--only <name>`.
- **Reaction cutaways go over long lines and silent holds, never over the turn.** A
  listener's face over the tail of a 1.5 s punchline ("Do mine first.", the skeptic
  caving) hid the moment the scene exists for. The speaker's face carries the turn.
- **A still with its own text (an approval screen) moves the subtitles.** Give that
  cutaway `"captionY"` (0.86 cleared the card); gate 3 fails a caption band that
  lands on a graphic's text (CAPTION-COLLISION).
- **Screen direction is set by the wide, and every single obeys it.** Build the
  wide first, then generate each close-up with **the wide as the environment
  reference** and an explicit eyeline written from the wide's geography: the person
  on the right of the wide looks screen-left, the people on the left look
  screen-right. Two characters who talk to each other must look in opposite
  directions in their singles. **No over-the-shoulder figures in singles** unless
  that shoulder belongs to a named cast member locked by reference; a generated OTS
  shoulder is a phantom extra person. When a character's old anchor keeps copying
  its own composition, pass it as "use ONLY for the face, hair and clothes; do not
  copy its framing, pose, background or anyone else in it". Look at all singles
  side by side with the wide before generating a single clip: this is the one
  check no tool makes.
- **Coverage per location:** one close-up angle per character, one
  over-the-shoulder in each direction, one wide for entrances and the
  resolution, and 4–6 **inserts** (hands on the counter, the stamp or signature,
  the product changing hands, the label). Inserts are 4–6 s silent takes trimmed
  to 1–3 s. **Open on the wide**, so the room's geography is set before the first
  close-up.
- **Continuity:** Seedance has no cross-clip memory. Hold it with the identical
  reference pack in every take, and when one angle continues across takes, hand
  off the last settled frame of take N as the start frame of take N+1.
- **Camera locked off** — the scene-format default
  (`production-discipline.md` §0). No push-ins, no handheld, one angle per take.
- **Look:** a TV-drama frame, not a phone video. Natural overhead / window
  light, a muted grade, a 35–50mm feel. Moderate depth of field is allowed in
  this variant — an explicit exception to the zero-bokeh realism anchor in
  `production-discipline.md` §12. Keep every skin realism anchor.
- **Document props are stills, not Seedance clips.** An ID card, a letter, a
  notice: render it in an image model that handles printed text (GPT Image 2)
  with invented fields, and hold it or give it a slow push in the edit. Printed
  text garbles once a video model moves it.

### Variant B — caught on a phone

- **The filmer is a character and the camera is their phone.** Handheld at
  chest height, re-framing toward whoever speaks; the other characters address
  the filmer.
- **Long takes.** Up to 15s on **Seedance 2.0**. A single uninterrupted take
  that must run past 15s goes to **Seedance 2.5**, whose image-driven route
  accepts only `aspect_ratio: "adaptive"` — it inherits the shape of the start
  still, so that still must already be 9:16. Join takes on a whip or a
  re-frame.
- **Still one speaking face per take** where you can stage it. Where the
  filmer and an on-screen character trade lines inside one handheld take, the
  filmer is off-camera — only the on-screen mouth has to sync.
- **The phone screen in the filmer's hand is captured, not generated.** Film
  the real funnel (`funnel-walkthrough.md` capture discipline: invented PII,
  real-time taps, the approval figure on screen) and composite it as a
  hand-held insert. Seedance garbles UI.
- **The agent call is audio over a call-screen insert.** A `tools/faceless.mjs
  --vo-only` voice with speakerphone EQ over a dialer still from
  `tools/card.mjs`. The agent is never on camera.

---

## Engine routing

| What | Model | Notes |
|---|---|---|
| Speaking coverage take (one face talking, 8–15s) | **`seedance-2.0-image-to-video`** — the full model, not `-fast-` | the face and lip-sync carry the scene (`model-specs.md` avatar-clip rule) |
| Wide / entrance / resolution take (several people, at most one speaking) | **`seedance-2.0-image-to-video`** | |
| Dedicated silent reaction take, inserts (hands, stamp, product changing hands) | `seedance-2.0-fast-image-to-video`, 4–6s, muted in the edit | no lip-sync to protect |
| Hero product shot | **`seedance-2.0-image-to-video`**, muted | from a still that matches the product reference exactly |
| Variant B handheld take ≤ 15s | **`seedance-2.0-image-to-video`** | |
| Variant B one-take > 15s | **`seedance-2.5-image-to-video`** | `aspect_ratio: "adaptive"` only |
| Start stills (empty set, character anchors, coverage frames, product) | Nanobanana Pro / GPT Image 2 | every Seedance take starts from one |
| Document prop | GPT Image 2 still, held or pushed in the edit | never a video generation |
| Variant B phone screen | captured | `funnel-walkthrough.md` |
| Speakerphone agent | `tools/faceless.mjs --vo-only` | over a `tools/card.mjs` dialer still |

**Moderation:** scrub platform brand words from every prompt you *send*
(`generation-adapters.md` → brand words fail whole jobs). If the spoken product
name in beat 11 trips moderation, generate that take without the name and lay
the name line in as a clone of the same speaker's take audio (the house voice
clone path) over the hero shot.

---

## Dialogue rules

- **Short lines.** 2–10 words; many one- to three-word reactions (a flat
  denial, a two-word contradiction, a one-line follow-up question). A line over
  twelve words is split.
- **Repeated reactions across speakers are allowed here.** Two or three
  characters piling on the same short question is overlapping dialogue, not a
  copywriter's parallel stack; the banned-pattern list
  (`copywriting-core.md` PART 1) governs narration and VO, not a crowd talking
  over each other. Everything else on that list still applies.
- **The hero never pitches.** Their lines are refusals, deflections and the
  trade. Benefits come out of a skeptic's mouth, read off the label or the
  screen.
- **The product name is spoken once, late** — at the hero shot, not before.
- **The price anchor comes from a bystander**, never the hero.
- **Escalate physically.** Voices rise, a lean over the counter, palms flat,
  a step back. One genuine emotional break (`house-playbook.md` §5); the rest
  of the read stays flat and fast.
- **Numbers spoken as words**, pronunciation notes for any product name
  (`house-playbook.md` §5). American accent unless the run names another (hard
  rule 17), written into every take's voice sentence.

---

## What Stage 4 produces

Write `04-prompts/drama.md` with these sections, in this order:

1. **Variant** — A or B, and why the DNA points there.
2. **Reference pack** — the numbered `@Image` list and each image's job.
3. **Cast sheet** — one block per character: persuasion role, the identity /
   outfit / voice sentences to paste, where they stand.
4. **Set sheet** — the empty set, geography, light direction, the barrier.
5. **Beat sheet** — the eleven beats, each with its persuasion job and its
   lines, speaker-attributed.
6. **Take plan** — what gets generated:

```
| take | angle            | character | lines covered (in order, pauses marked)        | s  | model                       |
|------|------------------|-----------|------------------------------------------------|----|-----------------------------|
| S1   | CU skeptic       | SKEPTIC   | L1 · pause · L3 · pause · L5                   | 12 | seedance-2.0-image-to-video |
| H1   | CU hero          | HERO      | pause · L2 · pause · L4                        | 10 | seedance-2.0-image-to-video |
| OTS1 | OTS → hero       | SKEPTIC   | L7 · pause · L9                                | 9  | seedance-2.0-image-to-video |
| W1   | wide, entrance   | AUTHORITY | L14                                            | 6  | seedance-2.0-image-to-video |
| I1   | insert, stamp    | —         | the stamp comes down                           | 5  | seedance-2.0-fast-image-to-video |
| P1   | document prop    | —         | (still, no generation)                         | —  | GPT Image 2                 |
```

7. **Shot list** — the cut, each shot pointing into a take. `in` / `out` are
   filled after generation from the take's word timings:

```
| #  | beat | shot       | speaker | line / action            | take | in–out    | audio  |
|----|------|------------|---------|--------------------------|------|-----------|--------|
| 01 | 1    | CU skeptic | SKEPTIC | L1                       | S1   | 0.0–3.4   | native |
| 02 | 1    | CU hero    | HERO    | L2                       | H1   | 2.1–3.6   | native |
| 03 | 1    | CU skeptic | SKEPTIC | L3                       | S1   | 5.2–7.3   | native |
| 04 | 2    | prop       | —       | the evidence, held       | P1   | still 2.5 | muted  |
| 05 | 2    | react hero | —       | jaw sets, silent         | H1   | 0.2–1.8   | muted  |
| …  |      |            |         |                          |      |           |        |
```

8. **Image prompts** in manifest order: empty set → character anchors →
   coverage start stills → product still → document props. A fresh duplicate
   still for any take that is regenerated after a moderation rejection
   (`production-discipline.md` §0).
9. **Take prompts** (Seedance prose, below), in generation order.
10. **`assemble.json`.**

### Take prompt skeleton (Seedance 2.0 prose, ≤ 2,000 characters)

```
━━━━━━━━━━━━━━━━━━━━━━
TAKE S1 — SKEPTIC close-up — 12s — seedance-2.0-image-to-video — ~[N]/2000 chars
Refs: @Image 1 is the empty set and its light. @Image 3 is the skeptic's face, hair and clothes.
━━━━━━━━━━━━━━━━━━━━━━
The [age] [ethnicity] woman from @Image 3, in the [colour] top from @Image 3,
sits behind the [barrier] of the counter from @Image 1, framed in a locked-off
close-up at eye level that never moves. She lifts the [prop] beside her face and
says in a [regional American] voice, clipped and certain: "[L1 verbatim]". She
stops talking completely and presses her lips together, eyes just left of the
lens on the customer, listening while her jaw tightens for two seconds. She
lowers the card an inch and says, slower: "[L3 verbatim]". Her mouth closes
again and one eyebrow lifts while she waits. Overhead office light, a soft
fluorescent hum and a printer somewhere behind her, no music. Television-drama
look, muted colour, vertical 9:16.
constraints: only this woman speaks and her lips stay closed between her lines,
no second face in focus, the product does not appear anywhere in frame, no
camera movement, the counter and glass stay exactly in place, no readable text
on the card, no subtitles, no captions, no on-screen text, no music.
```

Every sentence describes change over time; the dialogue is verbatim from
`03-rebuild.md` and appears nowhere else in the prompt (no-word-echo,
`production-discipline.md` §7); `audio` direction always present; bans live in
`constraints:`.

### `assemble.json`

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/drama",
  "aspect": "9:16", "size": "1080x1920",
  "banner": false, "disclosure": false,
  // film subtitles, not karaoke: sentence case, the script's punctuation, no highlight
  "captions": { "style": "plain", "uppercase": false, "maxWords": 5, "maxChars": 28, "size": 40, "y": 0.62 },
  "music": "~/Documents/Adsora/Video Assets Raw/Soundtracks/<tense-bed>.mp3",
  "musicVolume": 0.04,
  "jobs": [{
    "name": "drama__hook-1",
    "clips": [
      { "file": "05-assets/drama/S1.mp4", "in": 0.0, "out": 3.4, "script": "[L1]" },
      { "file": "05-assets/drama/H1.mp4", "in": 2.1, "out": 3.6, "script": "[L2]" },
      { "file": "05-assets/drama/S1.mp4", "in": 5.2, "out": 7.3, "script": "[L3]" },
      { "file": "05-assets/drama/P1.png", "seconds": 2.5 },
      { "file": "05-assets/drama/H1.mp4", "in": 0.2, "out": 1.8, "mute": true }
      // … one entry per shot-list row, in cut order
    ]
  }]
}
```

**Captions stay on (hard rule 23) but in the plain style.** A karaoke,
uppercase, highlighted card reads as an ad and breaks the scene in the first
second. `style: "plain"` with `uppercase: false` gives sentence-case film
subtitles that keep the script's punctuation, sitting above the counter / hands
line. Variant B: same style, `y` about 0.78, so the cards clear the phone held
in frame.

---

## Production rules

1. **Open mid-conflict.** The first frame is a face already arguing. No
   establishing shot, no walk-in, no silence.
2. **The product is invisible until beat 8.** Out of the reference pack and
   banned in `constraints:` on every earlier take.
3. **One speaking face per take.** Two mouths in one generation is the most
   common way this format breaks.
4. **Generate takes, cut shots.** Never plan a generation shorter than 4s;
   the 2–3s rhythm comes from `in` / `out` trims.
5. **Every alternative the prospect has tried gets named and rejected** in the
   interrogation ladder. Pull the list from the Stage 2 competitive
   disqualification, not from invention.
6. **The claims are read, not pitched** — off the label, the letter or the
   screen, by the skeptic.
7. **Keep one silent beat at the trade** (beat 7), 5–10s of action with almost
   no dialogue. It is where the tension peaks.
8. **The CTA happens twice**: inside the scene (beat 9, a character telling
   another where to get it) and over the hero shot (beat 11).
9. **The closing line calls back to beat 2.** It is the joke that makes the
   ending feel written rather than appended.
10. **Invented names and documents only**; every prop and frame checked at 1
    fps for anything real that leaked.
11. **90–200 seconds.** Cutting this to 30s removes beats 4–6, which is the
    part that works.

---

## Reference skeleton — variant A (177s, 3 characters, 4 roles)

Built from the house reference. Source video:
`~/Documents/Adsora/Research/x/skincare/_creatives/c8de26ccfd9f0fe3.mp4`; timed
transcript: `_transcripts/c8de26ccfd9f0fe3.srt` (plain: `.txt`); contact sheet:
`_frames/c8de26ccfd9f0fe3-contact.jpg`. This is the structure only — roles,
timing, exchange shape and job. **Stage 3 uses it as the example to copy when
building a drama without its own competitor transcript**: keep the timing band,
the role pattern and the exchange shapes; write new lines for the product
(`SKILL.md` operator note on copy). For line rhythm, read the transcript file.

**Cast mapping:** HERO = the customer (has the result, withholds it). SKEPTIC =
the counter clerk (refuses first, becomes the second convert). AUTHORITY = the
supervisor (escalation, delivers the price anchor, first convert, receives the
product).

| Time | Beat | Exchange shape (roles) | ~Lines | What the structure is doing |
|---|---|---|---|---|
| 0:00–0:08 | 1 Cold open | SKEPTIC refuses on the evidence → HERO contradicts flatly → SKEPTIC doubles down | 3 | Conflict before context. The refusal *is* the claim: she looks younger than her stated age. |
| 0:08–0:20 | 2 Evidence | SKEPTIC points at one specific feature in the photo → HERO says she fixed it → SKEPTIC says that can't be fixed | 4 | Before/after delivered as an accusation. "Can't be fixed" is the category belief the ad will break. |
| 0:20–0:42 | 3 Escalation | HERO states her stakes (long wait, needs to leave) → SKEPTIC can't verify → heat rises → HERO demands a supervisor, twice | 6 | Stakes, plus the ticking reason she will trade later. |
| 0:43–0:56 | 3b Authority enters | AUTHORITY asks → the two clerks disagree → AUTHORITY looks at the photo, turns to HERO and asks what she did | 6 | The second skeptic flips from judge to curious in one look. |
| 0:57–1:09 | 4 Ladder | AUTHORITY and SKEPTIC fire named alternatives, one or two words each; HERO rejects each → they land on the product's category | 6 | Every competing solution named and dismissed; the category is guessed by the doubters. |
| 1:10–1:12 | 5 Trade offer | HERO offers the answer in exchange for the stamp | 1 | The curiosity loop gets a price. |
| 1:13–1:21 | 6 Desire + pile-on | AUTHORITY: a relative spends a high price per jar and doesn't look like this → both demand the answer, repeatedly | 4 | Price anchor and desire from the skeptics, not the hero. |
| 1:22–1:25 | 4b Hero backstory | HERO: tried everything for years, nothing worked | 2 | The hero's own failed alternatives make her a peer, not a model. |
| 1:26–1:35 | 5b Standoff | SKEPTIC presses → HERO repeats the terms | 4 | Holds the loop one more round. |
| 1:35–1:49 | 7 The trade | ~10s mostly silent: the stamp comes down (insert), a few one-word beats, then the demand for the answer | 4 | Silent tension beat; the payoff is physical. |
| 1:50–2:06 | 8 Reveal | HERO concedes and hands it over → a skeptic reads the label aloud, benefit by benefit, ending on "all in one" → an awe line | 6 | Claims come out of the doubter's mouth, read off the packaging. |
| 2:06–2:12 | 8b Rarity | HERO: took years to find; sold online only, often sold out | 2 | Scarcity, and the CTA destination is planted. |
| 2:14–2:23 | 9 Transfer + second convert | AUTHORITY asks to keep it → HERO gives it (has another at home) → SKEPTIC asks what about her → HERO tells her to buy online | 6 | A gift, a second conversion, an in-scene CTA. |
| 2:25–2:31 | 10 Risk reversal | HERO: money-back guarantee, framed as the brand's confidence | 2 | Objection handled in character. |
| 2:31–2:46 | Exit | HERO leaves on a warm parting line → a thank-you | 2 | Resolution; lets the scene breathe before the pitch. |
| 2:46–2:56 | 11 Hero shot | Product on the counter → product name → callback to the ID photo → shop CTA | 3 | Brand, callback joke, CTA. |

**Numbers to hold when rebuilding:** ~65 spoken lines, 76 cuts, most lines
2–6 words, the product first seen at ~1:52 (63% of the runtime), its name
first spoken at ~2:46 (93%), one silent beat of ~10s at the trade.
