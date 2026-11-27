# QUICKSTART — one full run, start to finish

This is a complete example run so you can see the **shape** of the output before
trying your own. Everything here is a **placeholder** — a made-up competitor ad
and a made-up product. It runs in **prompt-only mode** (generation declined by
the user), so you can see the full output shape without spending anything.

> Convention below: **`You:`** is what you type. **`Claude:`** is the skill
> responding. Files it writes are shown in `code blocks`.

---

## You

> Remix this competitor ad for my product.

## Claude — Stage 1: INTAKE

> How do you have the competitor ad? Paste a transcript, drop a video file or
> screenshots, or describe it. I need at least: the hook line, the core claim,
> what proof it shows, the CTA, and the rough beat order.

## You

> It's a ~32-second single-person selfie video (a "yapper" ad). Transcript:
>
> "I need to talk about why I kept waking up at 4am, because it's not stress.
> I tried everything. Magnesium, no screens, the whole cold-room thing. Still up
> at 4, every night, staring at the ceiling. Then someone told me the problem
> isn't falling asleep, it's that my body never actually drops into the deep
> stage. This little device does one thing: it plays a specific low tone that
> pulls your brainwaves down into deep sleep. Sleep clinic ran it against a
> placebo and the deep-sleep minutes nearly doubled. First week I slept through
> to 6:30 for the first time in a year. I'm not exaggerating, I cried. It's like
> forty bucks. Link's in my bio, just try one week."

## Claude

> Got it. Writing intake.

```md
# 01-intake.md  (excerpt)
Received: 2026-09-02, user paste
Source form: transcript + one-line visual note
Runtime: ~32s
Visual format: single-person selfie "yapper", handheld, direct to camera
What it sells: a bedside device that plays a tone to deepen sleep

Verbatim hook: "I need to talk about why I kept waking up at 4am, because it's not stress."
Verbatim CTA: "Link's in my bio, just try one week."

Beat notes:
[0–6]  Hook: names the exact symptom (4am waking), pre-empts the obvious cause (stress)
[6–12] Problem/failed attempts: magnesium, no screens, cold room — all failed
[12–18] Reframe: "the problem isn't falling asleep, it's never dropping into deep stage"
[18–23] Mechanism: a low tone that pulls brainwaves into deep sleep
[23–27] Proof: sleep-clinic vs placebo, deep-sleep minutes "nearly doubled"
[27–30] Personal result: slept to 6:30 first time in a year, "I cried"
[30–32] CTA: "~$40, link in bio, try one week"
```

> → Stage 2.

---

## Claude — Stage 2: ANALYZE

```
━━━━━━━━━━━━━━━━━━━━━━
PERSUASION DNA
━━━━━━━━━━━━━━━━━━━━━━
HOOK:        "why I kept waking up at 4am — it's not stress" — type: callout + curiosity loop
CLAIM:       fixes the waking, not just the falling-asleep
MECHANISM:   a low tone that pulls brainwaves into the deep-sleep stage — named: no (opportunity to name it)
PROOF:       sleep-clinic vs placebo ("deep-sleep minutes nearly doubled") → personal result ("slept to 6:30, I cried")
             strongest: the clinic doubling stat, placed right AFTER the mechanism
BELIEF SHIFT: from "I've tried everything for my sleep and nothing works, so it's just me"
              → to "I was solving the wrong stage of sleep; this targets the one that was broken"
AVATAR:      someone who already tried the obvious sleep fixes and quit, blames themselves
DESIRE:      wake up rested without a fight | DRIVER: comfortable living / freedom from a daily dread
EMOTION ARC: frustration → recognition → hope → relief (→ light urgency at CTA)
AWARENESS:   Problem-aware (knows the problem, not that this category of fix exists)
SOPHISTICATION: Stage 3 — the market has heard "sleep aid" claims; needs a NEW MECHANISM and a WHY
NESB:  N: "the problem isn't falling asleep"  E: "does one thing"  S: "sleep clinic vs placebo"  B: "nearly doubled"
OBJECTIONS HANDLED: "I've tried everything" (lists three, all failed) · "does it actually work" (clinic + placebo)
WINNING ELEMENT: the reframe — it converts the prospect's past failures into proof that they were aiming at the wrong target
FORMAT SEEN: single selfie, handheld, fast confessional pace, one emotional spike ("I cried")
━━━━━━━━━━━━━━━━━━━━━━
```

| # | ~time | Beat role | What carries it | Persuasion job |
|---|-------|-----------|-----------------|----------------|
| 1 | 0–6s | Hook | "why I kept waking at 4am — it's not stress" | call out the exact symptom, open a loop by denying the obvious cause |
| 2 | 6–12s | Problem / failed attempts | "magnesium, no screens, cold room — still up at 4" | make the prospect feel seen; pre-empt "I've tried everything" |
| 3 | 12–18s | Reframe | "the problem isn't falling asleep, it's the deep stage" | the belief shift — move the target |
| 4 | 18–23s | Mechanism | "a low tone that pulls brainwaves into deep sleep" | give the new target a believable method |
| 5 | 23–27s | Proof | "clinic vs placebo, deep-sleep minutes nearly doubled" | make the claim credible, placed after the mechanism |
| 6 | 27–30s | Personal result | "slept to 6:30, first time in a year, I cried" | emotional payoff, one spike |
| 7 | 30–32s | CTA | "~$40, link in bio, try one week" | low-friction, reversible ask |

> **Why it works:** the whole ad rests on beat 3. By moving the target from
> "falling asleep" to "the deep stage", every failed thing the prospect already
> tried stops being evidence against the pitch and becomes evidence *for* it
> ("of course magnesium didn't work, it wasn't aimed here"). The proof is light
> but correctly ordered — the doubling stat lands right after the mechanism, not
> before. The single "I cried" spike is the only big emotional move; the rest is
> flat and fast, which reads as honest. Keep: the callout hook that denies the
> obvious cause, the reframe, proof-after-mechanism, exactly one emotional spike.
>
> Does this match the ad as you see it?

## You

> Yes, that's it.

---

## Claude — Stage 3: REBUILD  *(the checkpoint)*

> Quick intake on your side:
> 1. Product — what is it, one or two lines?
> 2. Offer — price, format, guarantee/deadline?
> 3. Character — who's on screen? (real-person creator / founder / animated / no preference)
> 4. Tone — how should it sound? (a sample or a description)

## You

> 1. **[APP]** — a wind-down app. You pick a "session", it plays a guided
>    breathing pace with audio, and it nudges you off your phone.
> 2. **[OFFER]** — free for 7 days, then $6/month. Cancel anytime.
> 3. No preference — a real-person creator is fine.
> 4. Plain and a bit dry. No hype, no "game-changer".

## Claude

```md
# 03-rebuild.md  (excerpt) — REBUILD for [APP]

## Inherited DNA (unchanged)
Hook type: callout + curiosity loop (deny the obvious cause)
Belief shift: from "I've tried to sleep better and nothing sticks, must be me"
             → to "I was managing the wrong moment; the problem is the 20 minutes before bed"
Beat order: Hook → Failed attempts → Reframe → Mechanism → Proof → Personal result (one spike) → CTA
NESB pattern: N in the reframe · E "one thing" · S a study/number · B a doubling-type stat
Runtime band: ~30–34s, fast confessional, ONE emotional spike

## The rebuilt script

### Hooks (test all five — same body; the spoken line is the caption, so there is no separate on-screen text to write)
1. VO: "Here's why I could not stay off my phone at night, and it wasn't a willpower thing."
2. VO: "I figured out why 'just put the phone down' never worked for me."
3. VO: "The reason you scroll till 1am is not the reason everyone tells you."
4. VO: "For anyone who has tried and failed to have a bedtime routine: it's not you."
5. VO: "I tried every wind-down trick for a year. One thing actually moved the needle."

### Body (beat by beat)

**Beat 1 — Hook — call out the symptom, deny the obvious cause**
VO: "Here's why I could not stay off my phone at night, and it wasn't a willpower thing."
Sees: creator on a bed, lamp on, phone in hand, talking straight to camera.

**Beat 2 — Failed attempts — pre-empt 'I've tried everything'**
VO: "I tried the phone-in-another-room thing. Charging it in the kitchen. One of
those paper books. I'd still be back on it within ten minutes."
Sees: quick shots — phone on a kitchen counter, a paperback face-down, the creator back on the phone in bed.

**Beat 3 — Reframe — move the target (the belief shift)**
VO: "Someone pointed out the problem isn't the phone. It's that I had nothing to
actually do in the twenty minutes before sleep, so I filled it with scrolling."
Sees: creator, calmer, putting the phone screen-down.

**Beat 4 — Mechanism — a believable method for the new target**
VO: "So now I open [APP]. You pick a short session and it just runs a slow
breathing pace with sound. That's the whole thing. It gives those twenty minutes
a job."
Sees: the app open, a simple session screen, the creator following the pace with eyes closed.

**Beat 5 — Proof — after the mechanism**
VO: "They ran it in a small study against a plain timer. The [APP] group fell
asleep about twice as fast and checked their phone half as much in bed."
Sees: a simple two-bar comparison on screen (placeholder proof — see flag).

**Beat 6 — Personal result — the one spike**
VO: "First week, I put the phone on the dresser and did not pick it back up.
I have not done that since college."
Sees: the creator, phone face-down on a dresser across the room, lamp off.

**Beat 7 — CTA — low-friction, reversible**
VO: "It's free for a week. Try it for seven nights and see."
Sees: the app icon, then a hand setting the phone down.

Total spoken: ~120 words / ~33s

Captions: burned from the VO by `tools/assemble.mjs` in the house spec, on by
default, nothing authored (hard rule 23). No graphic needed for this one beyond
the end card.

## Proposed avatar / character
Real-person UGC creator. Late-20s to mid-30s, gender-neutral casting, average-
pretty (not a model), tired-but-not-sick warm face, shoulder-length hair loose,
a plain sleep tee. Setting: a real lived-in bedroom at night — one warm bedside
lamp, a cluttered nightstand (charger, a glass of water, a paperback), clothes on
a chair. Voice: calm, dry, unhurried, mid-US accent, "telling a friend, not
performing".
Product on-screen: the app UI (a simple session screen). Label handling: UI is
generic placeholder; real screenshots composited in post.

## Open flags
- [NEED TO CONFIRM] the study in Beat 5 is a placeholder. If you don't have one,
  options: (a) a founder line ("we tested it on 200 beta users, median time-to-
  sleep dropped from 40 to 20 minutes"), (b) an aggregate app-store rating, (c)
  drop the stat and lean the proof entirely on Beat 6. The competitor leans on a
  clinic stat here, so replacing it with nothing weakens the remix.
```

> Here's the rebuilt script and the proposed creator. **Nothing is generated and
> no credits are spent until you approve.** Reply "approved", or send edits.

## You

> Approved. Use hook #4. And for Beat 5 use option (a) — the 200 beta users line,
> 40 minutes down to 20.

## Claude

> Folded in. Hook #4 is the built hook; the other four are noted as swap-in
> alternates. Beat 5 now reads: *"We tested it on 200 people before launch. The
> median time to fall asleep went from 40 minutes to 20."* Logged the approval.
> → Stage 4.

---

## Claude — Stage 4: FAN OUT

> Which formats? Reply "all" or pick from:
> 1 podcast-duo · 2 talking-head · 3 ugc-yapper · 4 pixar-3d-character ·
> 5 lego-stop-motion · 6 low-poly-ps1 · 7 paper-collage ·
> 8 whiteboard-marker-explainer · 9 simpsons-flat-2d

## You

> 3, 8, and 9.

## Claude

> Building ugc-yapper, whiteboard-marker-explainer, simpsons-flat-2d. Same
> script, same beats, same dialogue in all three. Files written to
> `04-prompts/`. Highlights below; full prompts are in the files.

### `04-prompts/ugc-yapper.md`  (excerpt — Seedance 2.0)

```
CHARACTER REFERENCE (for all clips)
Speaker: early-30s, gender-neutral casting, average-pretty warm face, shoulder-
length loose hair, plain grey sleep tee, calm-tired energy.
Voice: mid-US accent, calm and dry, unhurried, telling-a-friend cadence.
// Attach the speaker photo as @Image 1 in every clip.
// Attach the app session-screen mockup as @Image 3 only in the mechanism clip.

CLIP 1 — 15s | selfie handheld | ~690/2000 chars
The person from @Image 1 films themselves sitting up in bed at night, one warm
lamp on the cluttered nightstand beside them (charger cable, a water glass, a
paperback), holding the phone at arm's length in one hand, front camera, small
wrist drift. They glance down at the phone in their other hand, then back to the
lens as they start, a flat tired half-smile. On the second sentence they set that
phone face-down on the duvet without looking at it. Warm low lamplight, soft
shadows, faint room-tone hum, no music. They say in a calm dry mid-US voice, like
telling a friend: "For anyone who has tried and failed to have a bedtime routine:
it's not you. I tried the phone-in-another-room thing. Charging it in the kitchen.
One of those paper books. I'd still be back on it within ten minutes." Raw phone
footage, no-filter realism, tired-honest energy. Vertical 9:16.
constraints: no readable on-screen text, no captions, no logos, no second person
in frame, no phone or camera visible beyond the two phones the speaker holds and
sets down, no morphing hands, preserve identity and wardrobe, keep the bedroom
unchanged, no beauty filter, no colour grade, mouth motion matches the words,
no doubled audio.

CLIP 2 — 14s | selfie handheld | ~700/2000 chars   [reframe + mechanism]
... (continues, @Image 3 introduced for the app screen) ...

CLIP 3 — 8s | selfie handheld | ~410/2000 chars    [personal result + CTA]
Same bedroom, same selfie angle from @Image 1, lamp now off, phone face-down on a
dresser across the room behind them. They half-laugh once, quiet, look back to the
lens. Calm dry voice: "First week, I put the phone on the dresser and did not pick
it back up. I have not done that since college. It's free for a week. Try it for
seven nights and see." Same room tone, no music. Vertical 9:16.
constraints: [same clause].
```

### `04-prompts/whiteboard-marker-explainer.md`  (excerpt — image model → Omni)

```
Board variant: whiteboard  ·  Accent colour: teal (#1F9E8F)  ·  Drawing hand: yes (locked)

Clip 1 — Hook — draws: a small stick figure lying in bed, a phone glow drawn as a
jagged spiky blob over its face, a red clock reading 1:00. Board text: "it's not you".
Clip 2 — Failed attempts — draws: three crossed-out icons in a row (a phone in a
box, a paperback, a kitchen) each with a red X. Board text: none.
Clip 3 — Reframe — erases the phone blob, boxes a fresh region, writes "THE 20
MIN BEFORE" in a hand-drawn rectangle outlined in teal. Board text: "THE 20 MIN BEFORE".
Clip 4 — Mechanism — draws an arrow from the boxed region to a simple phone
outline filled teal, a small breathing wave inside it. Board text: "give it a job".
Clip 5 — Proof — writes "40 → 20 min" and circles it in teal, a small "n=200" beside it.
Clip 6 — CTA — draws the app icon outline (teal fill), an arrow to a hand-drawn
button. Board text: "free 7 nights".

HAND LOCK — the same drawing hand and forearm every clip. Warm mid tone (#C9A07A),
plain charcoal sleeve rolled once at the cuff, holding a plain black dry-erase
marker with no brand. Enters from the bottom-right, draws, withdraws. No watch,
no second hand.

--- Image keyframe — Clip 3 board state ---
Hyper realistic photograph of a real whiteboard on a plain wall, shot straight-on,
vertical 9:16, filling the frame. The board currently shows, in black dry-erase
marker, hand-lettered and slightly uneven: a small stick figure lying down on the
left, three crossed-out icons in a row along the top each with a red X, and a
faint ghost of an erased spiky blob. Empty space on the lower-right. A warm mid-
tone hand and forearm in a charcoal rolled sleeve enters from the bottom-right
holding a plain black marker, mid-stroke, about to draw a rectangle. Flat even
room light, no glare hotspot, slight real marker texture. No typeset text, no
logos, no captions. Reads as a real photo of a real board mid-lesson. 9:16
vertical.
Negative Prompt: no photorealism beyond the board itself, no 3D, no smooth vector
reveal, no full-sentence captions, no typeset font, no brand logos, more than
three marker colours, glossy surfaces, gradient shading, realistic human beyond
the drawing hand and forearm, motion blur, camera moves, board warping.

--- Video clip — Clip 3 (Omni, 7s) ---
A 7-second hand-drawn whiteboard explainer clip, vertical 9:16. Use the attached
image as the opening keyframe — match the board surface, the existing hand-
lettered drawing, the teal accent and the flat room light precisely.
00:00–00:07 — ONE drawn action: the hand enters from the bottom-right and draws a
rectangle around an empty region, stroke by stroke with real-hand wobble and
uneven ink, then hand-letters the words THE 20 MIN BEFORE inside it; the rectangle
outline is teal, the lettering black; the hand withdraws as the last letter lands.
The existing stick figure and crossed-out icons do not change. The board stays
flat and still.
VOICEOVER (calm clear teacherly female, English): "The problem was never the
phone. It was the twenty minutes before sleep with nothing to do in them."
State constraints: existing drawing unchanged, board does not warp, camera does
not move, no colour beyond teal and red, lettering stays hand-drawn.
AUDIO: soft squeak of a dry-erase marker, faint room tone. Voice lock: "calm
clear teacherly female English voice, measured, unhurried, close and warm." No
background music.
— STYLE LOCK (keep verbatim on every clip) —
Stay inside one hand-drawn whiteboard universe. Everything is drawn on the flat
board in black dry-erase marker with at most one accent colour (teal) and, for
problems only, red. No photoreal scene, no 3D, no smooth digital animation. Every
stroke appears progressively as if drawn by a real hand, with slight wobble,
uneven ink, and tiny overshoot at stroke ends — never a clean vector wipe.
Figures are simple stick drawings; objects are simple icons; labels are short
hand-lettered words. The board stays flat and static; the camera does not move.
Erase-and-wipe transitions between regions. Do not render a realistic
environment, do not add typeset text, do not smooth the linework.
ASPECT: 9:16 vertical.
Negative: no photoreal scene, no 3D, no smooth vector reveal, no typeset text, no
full-sentence captions, no logos, no camera move, no board warp, linework stays
hand-drawn and uneven.
Continue from the exact final frame of the previous clip. Same board, same wall,
same light, same teal accent, same existing drawing, same voice. No reset.
```

### `04-prompts/simpsons-flat-2d.md`  (excerpt — avatar-scene mode, image model → Kling)

```
Sub-mode: avatar scene (one cartoon person acts out the beats)
Palette lock (hex): skin #F3C48B · hair #3A2A1E · sleep tee #8FA9B8 · bedsheet
#E7E0D2 · wall #B7CBD1 · lamp glow #F2C46A · phone glow (problem) #C43C3C ·
accent (the app) #1F9E8F
Motion: limited animation, on twos, held key poses, snappy, tiny settle. No 3D,
no smooth interpolation, no rubber-hose. Constant even black outline.

--- Character model sheet (anchor, NEW) ---
A 2D flat cel-animation character model sheet, three views in a row (front,
three-quarter, side), plain off-white background, vertical 9:16.
Character: a tired early-30s cartoon person, flat suburban-sitcom cartoon style —
thick even solid black outline of constant weight, flat colour fills with a
single flat cel-shadow tone, no gradients. Rounded head with a slight overbite,
four-finger hands. Flat colours: skin #F3C48B, hair one solid rounded silhouette
shape #3A2A1E, loose shoulder-length, plain sleep tee #8FA9B8. Signature detail:
one small hair tuft that always sticks up at the back. Neutral tired expression,
slight eye bags drawn as two flat curved lines.
Limited palette, flat lighting, clean even linework with a hand-drawn feel, no
3D, no rendering, no background scene. 9:16 vertical.
Negative Prompt: no 3D, no gradient shading beyond one flat cel tone, no smooth
interpolation, no rubber-hose, no variable or sketchy outline weight, no
photorealism, no realistic lighting, no lens blur, no copyrighted or trademarked
character likeness, no named show characters, no rendered logos or captions, no
colours outside the locked palette.

--- Expression still — "annoyed/defeated" (LOCK to model sheet) ---
A single 2D flat cel-animation character portrait, plain flat #B7CBD1 background,
vertical 9:16.
CHARACTER LOCK — same character as the model-sheet reference. Same constant-weight
black outline, same flat fills (skin #F3C48B, hair #3A2A1E, tee #8FA9B8), same
hair silhouette with the back tuft, same overbite, same eye-bag lines. Do not
change any colour or the outline weight.
Expression: annoyed/defeated — half-lidded eyes, flat straight mouth, one eyebrow
lower than the other. Chest-up framing, slumped a little.
Flat lighting, single cel-shadow tone, no gradient, no 3D, no background scene.
9:16 vertical.
Negative Prompt: [same as model sheet].

--- Video clip — Beat 3 reframe (Kling, image already loaded) ---
Realistic 9:16 flat 2D cel-animation clip. Animate the referred cartoon character
image: the character sits on the flat cartoon bed, sets a phone face-down on the
duvet without looking at it, then faces camera and speaks the words "Someone
pointed out the problem is not the phone it is that I had nothing to do in the
twenty minutes before sleep so I filled it with scrolling" using classic limited-
animation mouth shapes, a 4-position mouth chart (rest, open-A, wide-E, round-O),
no realistic lip motion. The single dominant action is the phone set-down and a
small settle. Animate on twos, hold key poses, snappy transitions between a few
poses with a tiny settle. The face expression does not change from the still.
Outline weight stays constant, flat fills stay flat, the single cel-shadow tone
does not gradient, the flat background does not move. Native audio, calm dry
mid-US female voice, lip-synced to the line. No background music, faint flat room
tone.
Negative: no 3D, no smooth interpolation, no rubber-hose, no gradient shading, no
outline-weight change, no extra characters, no floating text or captions, no
camera move, no photoreal rendering.
```

> All three format files also include their full frame manifest and an assembly
> note. **Evolink** is configured — I can generate the assets now (I'll quote the
> cost first), or hand these back for you to paste yourself.

## You

> Hand them back — I'll paste them myself this time.

---

## Claude — Stage 5: GENERATE & DELIVER  *(prompt-only, by your choice)*

> Skipping generation at your request. Here's where each prompt goes:

| Format | Stills → paste into | Clips → paste into | Notes |
|---|---|---|---|
| ugc-yapper | (none — Seedance uses the reference pack) | Seedance 2.0, prose box; attach the speaker photo as `@Image 1` | draft 480p, finalize 720p; chain clip N as `@Video 1` into N+1 |
| whiteboard-marker-explainer | your image model, "board state" prompts in order (each LOCKs to the first) | Google Omni, 16-block box; attach each board still as `@image1` | frame-chain the growing board; composite the real app logo in post |
| simpsons-flat-2d | your image model — model sheet first, then each expression still (LOCK) | Kling image-to-video; load the expression still as the start frame | limited-animation motion; word-highlighted captions burned in by the assembly pass |

> (Had you said "generate", it would have shown a per-asset cost table against the
> $5 budget, waited for "go", then run stills → clips through Evolink — with the
> yapper clips going to Adsora Gen on our own GPU, since `RUNPOD_API_KEY` is set
> here — and downloaded them to `05-assets/`.)

```md
# DELIVERY.md  (excerpt)
Ran: 2026-09-02 · Generator: prompt-only (Evolink configured, generation
declined for this run) · Spend: $0

What was analyzed: a ~32s single-person "yapper" sleep-device ad. DNA: callout +
curiosity-loop hook, belief shift "nothing works, must be me" → "I was aiming at
the wrong stage", 7 beats, proof after mechanism, one emotional spike.

What was approved: rebuilt 7-beat script + real-person night-bedroom creator for
[APP], approved 2026-09-02 with 2 edits (hook #4; Beat 5 → 200-user founder line).

What was generated: nothing (prompt-only). Prompt files:
  04-prompts/ugc-yapper.md
  04-prompts/whiteboard-marker-explainer.md
  04-prompts/simpsons-flat-2d.md

Not built (user picked a subset): podcast-duo, talking-head, pixar-3d-character,
lego-stop-motion, low-poly-ps1, paper-collage. Say "build the rest" any time.

Needs a human call:
- Beat 5 proof is a founder claim ("200 people, 40 min → 20 min"). Confirm the
  real number before this ships.
- ugc-yapper Clip 2 runs 14s of dialogue — fine for Seedance 15s, tight for a
  6s-sweet-spot re-cut if you switch models.
```

```json
// status.json (final)
{ "slug": "2026-09-02-sleep-yapper", "stage": 5, "stage_name": "GENERATE",
  "state": "DONE", "blocked_on_user": false,
  "done": ["INTAKE","ANALYZE","REBUILD","FAN_OUT","GENERATE"],
  "formats_selected": ["ugc-yapper","whiteboard-marker-explainer","simpsons-flat-2d"],
  "generator": {"adapter": "evolink", "detected": true, "used": false, "reason": "user declined generation",
                 "per_format": {"ugc-yapper": "adsoragen"}},
  "spend": {"currency":"USD","estimated":0,"actual":0} }
```

> Done. Everything is in `ad-remix-runs/2026-09-02-sleep-yapper/`. Approve the
> Beat 5 number and you can paste the prompts straight into your tools, say
> "generate these" to run them, or say "build the rest" for the other ten
> formats.

---

## What you just saw

- **Five stages, each gated.** The pipeline stopped after ANALYZE for a sanity
  check and **hard-stopped after REBUILD** for approval before any prompt work.
- **A readable breakdown**, not a JSON dump.
- **Same persuasion machine, new product** — the reframe, the beat order, and
  proof-after-mechanism all carried across unchanged.
- **Three formats, one script** — a Seedance prose format and the two
  authored-here modules (whiteboard marker, flat 2D), each producing valid,
  paste-ready prompts with their own locks and negative constraints.
- **Generation is optional** — Evolink was configured and offered with a cost
  quote; the user chose prompt-only, so it delivered prompts + a paste map. With
  no key at all it does the same thing instead of failing.
- **One folder, one status file** — checkable from anywhere.

---

## The same run, hands-off

If you had opened with **"Remix this competitor ad and run it hands-off"**, the
transcript collapses to:

```
You:    Remix this competitor ad and run it hands-off. [transcript]
Claude: [Stage 1 INTAKE + Stage 2 ANALYZE + Stage 3 REBUILD — no stops]
        📲 push notification: Remix "sleep-yapper": script + avatar ready.
           Open 03-rebuild.md and reply "approved" to run it.
        [writes 03-rebuild.md, sets BLOCKED_ON_APPROVAL, stops]

  ── you're on your walk. you open 03-rebuild.md on your phone. ──

You:    approved, use hook #4, Beat 5 = the 200-user line
Claude: [folds edits in]
        [Stage 4 FAN OUT — no format question, uses the pre-committed
         list: ugc-yapper, podcast-duo, whiteboard, simpsons]
        [Stage 5 GENERATE — cost quote $3.90 ≤ $5.00 ceiling, auto-proceeds,
         runs stills then clips through Evolink (yapper → Adsora Gen),
         downloads to 05-assets/]
        📲 push notification: Remix "sleep-yapper": done. 12 clips across
           4 formats in ad-remix-runs/2026-09-02-sleep-yapper/. Cost $3.72.
```

One tap between "drop the ad in" and "clips are ready". The script-approval gate
is the only thing that stops you — by design, it's the one call worth making.
Everything else — format choice, cost confirmation — was decided once in
`config/generators.json`. If the cost had come in over $5, or Evolink had
rejected the key, you'd have gotten a *"needs your call"* notification instead of
a silent stall.
