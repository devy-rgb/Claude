# Format Module — Walking-and-Talking

One person on camera, in motion — walking down a store aisle, along a sidewalk,
through a house — talking straight through the walk instead of standing still.
Reads as caught-in-the-moment and kinetic where `talking-head` reads as composed;
the movement itself sells energy and "come with me" intimacy (the store-aisle /
street-walk UGC style).

**Engine stack:** Nanobanana Pro waypoint stills → Google Omni (first/last-frame
interpolation per leg, same mechanic as `pov-first-person`) as the default; on
Adsora Gen (MiniMax H3), chained `i2v` per hard rule 19 carries the walk instead —
see §2 below. Read `references/model-specs.md`, `references/house-playbook.md`,
and `references/talking-head-long-form.md` first; this format layers on top of
both.

> **The one problem this format exists to solve: the background must not drift.**
> Every other locked-off format holds the environment still by literally not
> moving the camera. This format moves through the environment on purpose, which
> is exactly the condition under which a chained generator is most likely to
> reinvent the location clip to clip (a different store, a shelf that changes
> contents, sidewalk that becomes a parking lot). §1–§2 below are the fix. Do not
> attempt a walk-and-talk longer than one clip without reading them.

---

## When this format fits the DNA

A confident, in-motion authority beat ("let me show you") · a shop-with-me or
day-in-the-life frame · a hook that benefits from forward momentum instead of a
static setup · any DNA where the competitor ad itself tracks a person moving
through a real space while they talk. If the competitor ad is a static
spokesperson piece, that's `talking-head`, not this.

---

## §1. ROUTE LOCK — plan the whole walk before generating anything

Do this **before** the first still. A walk-and-talk that is only one clip
(≤ 15 s, one continuous take) can skip straight to §3. Anything longer — the
"long video" case this format is built for — needs a written route.

1. **Write the route as a numbered waypoint list**, one waypoint per planned
   clip, each with 2–4 **named, fixed landmarks**: `Waypoint 1 — cereal aisle
   entrance: red BOGO endcap sign on the left, tall white shelving both sides,
   speckled grey floor. Waypoint 2 — mid-aisle: yellow "wet floor" sign on the
   right, cereal boxes continue both sides, fluorescent panel lighting overhead.
   Waypoint 3 — aisle exit: dairy case visible ahead through the gap, blue-white
   light spill, end-cap turns the corner.` This list is the single source of
   truth for the location. Every clip's environment description is pulled from
   it, never freely re-described.
2. **The route only ever moves forward.** No waypoint repeats or reverses a
   landmark from an earlier one; new landmarks may appear (you're further down
   the aisle) but nothing already passed should still be in frame unless the
   walk turns back on itself by design (state that explicitly if so).
3. **Generate one wide establishing still of the space before any waypoint
   still** (house-playbook §4, "build the environment empty first") — the same
   aisle or street, no person in it, wide enough to show the geometry the
   waypoints will reference. This still is never shot directly; it exists so
   every later waypoint still is describing the *same room*, not inventing one.
4. **One duplicate still per waypoint**, each a fresh Nanobanana Pro generation
   (never crop/zoom a single still to fake the next position — see house-playbook
   §6, "duplicate stills for repeat generations"): CHARACTER LOCK to the anchor
   for the person, and the new **ROUTE LOCK** block (added to the lock
   vocabulary, house-playbook.md §2) for the place:

   ```
   ROUTE LOCK: This is the same [store/street] as every other frame in this ad,
   continuing directly from the walk already in progress. Landmarks confirmed so
   far: [restate every waypoint up to and including this one, verbatim from the
   route list]. Nothing about the location resets, changes brand, changes layout,
   or changes lighting temperature except the normal forward progress of passing
   these landmarks. No landmark from an earlier waypoint reappears unless the
   route explicitly says the walk turns back.
   ```

## §2. Long-video chaining (Adsora Gen / chained `i2v`)

When Adsora Gen is `LIVE` (hard rule 19), this format still uses the chained
`i2v` mechanic from `references/talking-head-long-form.md` — same script
chunking (≤ ~29 words, sentence-bounded), same last-settled-frame handoff, same
one seed for the whole chain, same `-c copy` concat — with two additions on top:

1. **The seed frame for clip N+1 is not just "the last settled frame."** It is
   the last settled frame **of waypoint N's still**, i2v'd forward with both the
   walking motion and the line for that chunk. The chain therefore alternates
   generation source with plan: waypoint still → chunk clip → next waypoint
   still → next chunk clip, not four clips chained off one original portrait.
2. **The joins sheet becomes a route sheet.** Before sending, build the same
   contact sheet `talking-head-long-form.md` §2 step 8 describes (clip N's last
   frame beside clip N+1's first), but check it against the **waypoint list**,
   not just pose continuity: do the named landmarks in each frame match what
   that waypoint promised? A pose match with a drifted background still fails
   this check — send it back for a re-roll on that waypoint's still, not the
   clip.

On Omni/Kling instead of Adsora Gen, use first/last-frame interpolation per leg
exactly as `pov-first-person.md` does for its entrance clip — @image1 = arriving
at waypoint N, @image2 = arriving at waypoint N+1, CAMERA / MOTION PATH describes
the walk between the two named positions on the route.

---

## §3. Production rules

1. **Camera moves WITH the walker — the second sanctioned exception to the
   locked-off default** (house-playbook §3; the first is `pov-first-person`).
   Two variants, pick one per DNA and hold it for the whole ad:
   - **Selfie-POV**: phone held at arm's length by the walker, their own arm/hand
     occasionally at the frame edge, natural handheld walking bob.
   - **Follow-cam**: a steady Steadicam-style shot leading or trailing the
     walker at a fixed distance, walker centred, background scrolling past.
   Whichever is chosen, state it explicitly in every clip and never mix the two
   inside one ad.
2. **One walking speed, one direction, for the whole chain.** No stopping to
   plant and deliver a line then resuming — the talking and the walking are
   continuous and simultaneous. If a beat genuinely needs a stop (a product
   pickup, a direct-to-lens CTA), stage it as its own clip with an explicit
   "the walk pauses here" note and resume the same pace after.
3. **Anchored character, restated every clip** — full describe on the first
   still (CHARACTER LOCK on every later one), exactly as `talking-head` §
   "Production rules" #1.
4. **Voice lock verbatim every clip** (house-playbook §2) — a walk changes
   nothing about the voice discipline.
5. **Clip length:** 8–13s per leg on Adsora Gen (leaves slack for the mouth to
   close before the cut, per talking-head-long-form.md §2 step 4); up to 15s on
   Omni/Kling per leg if the route only needs two or three waypoints.
6. **Product**, if carried, is held throughout rather than picked up mid-walk
   (a pickup gesture while also walking and talking is too much simultaneous
   action — see house-playbook §5 "time budget per action" and §6's "escalating
   specificity backfires" lesson: split it into its own paused beat instead of
   cramming it into a walking clip).
7. **Background people, if any, stay background.** Same rule as house-playbook
   §6 "background people move / react distractingly": named extras hold their
   own positions/actions and do not react to the walker unless the DNA calls for
   a specific, scripted acknowledgment (a nod from a passer-by).
8. **No disclaimer** (hard rule 14). Captions burned in the assembly pass only
   (hard rule 23) — no authored on-screen text in any still or clip prompt.

## Negative constraints (pool — 4–8 targeted per clip)

```
no subtitles, no captions, no on-screen text, no logos, no watermarks, the
location does not change brand or layout between clips, no shelf or sign content
different from the route list, no lighting colour-temperature shift between
clips, no landmark from an earlier waypoint reappearing out of order, camera
does not stop, reverse, or change following distance/height mid-clip, walker
does not change walking speed or pause unless the beat calls for a stop, mouth
motion matches the dialogue exactly, no doubled or echoed words, no beauty
filter, no skin smoothing, no HDR, no cinematic colour grade, no artificial
sharpening, no face morphing, no identity drift, no wardrobe change, no extra
fingers, no warped hands, product label stays readable and unwarped, no
AI-generated text on the label, no flicker, no jitter
```

---

## Paste-ready skeletons

### Still — establishing plate (empty environment, NOT a shootable frame)

```
Hyper realistic wide establishing shot of [the aisle / street / room], empty, no
people. [Every fixed landmark named with position: shelving, signage, floor
texture, light fixtures, far-end feature]. Even, realistic [fluorescent /
daylight] lighting at [approx temp]K. Deep focus, natural colour, no artificial
blur. This still exists only to fix the geography; it is not used directly in
any clip.
```

### Still — Waypoint N (NEW for Waypoint 1, CHARACTER LOCK + ROUTE LOCK for every later one)

```
Hyper realistic candid [selfie-POV / follow-cam] shot ONLY (no bokeh, no portrait
mode): A [age] [gender] [ethnicity] person with [build, hair, 2–3 imperfections],
wearing [garment, colour, fit], mid-stride, walking through [the space].

CHARACTER LOCK: same person as every earlier frame — [restate face/hair/build/
wardrobe exactly].

ROUTE LOCK: [the §1 block, waypoints restated verbatim through this one].

[Selfie-POV: phone-arm's-length framing, walker's own [hand/arm] at the frame
edge. / Follow-cam: fixed following distance, walker centred, [eye-level /
slightly low] camera height.] Candid mobile camera quality, natural colour, mild
compression, slight sharpening. No captions, no on-screen text. 9:16 vertical.
```

### Clip — walking leg (Google Omni 16-block brief, first/last-frame interpolation between Waypoint N and N+1)

```
FORMAT: 8–12-second vertical 9:16 realistic UGC video using first/last frame
interpolation between two supplied keyframes.

QUALITY / FIDELITY LOCK: Match both reference images' lighting, texture, and
phone image quality exactly. No sharpen, no beauty filter, no HDR, no colour
grade. Raw, organic, true to the references.

IDENTITY LOCK: @image1 and @image2 show the exact same [role/person] —
[face/hair/build]. No identity drift between frames.

OUTFIT LOCK: [every garment + accessory]. Unchanged across the clip.

ROUTE LOCK: [the §1 block through Waypoint N+1]. Nothing about the location
resets, changes brand, or changes lighting between @image1 and @image2 — only
the normal forward walk between the two named waypoints.

SCENE DESCRIPTION: @image1 shows [arriving at Waypoint N]. @image2 shows
[arriving at Waypoint N+1]. This clip is the continuous walk connecting those
two positions — no jump, no teleport.

CAMERA: [Selfie-POV, arm's-length, natural handheld walking bob / Follow-cam,
fixed following distance at [height], smooth lateral tracking]. One continuous
take, one consistent walking pace and direction throughout. No stop, no
reversal, no whip pan, no unrequested push-in or zoom.

CAMERA / MOTION PATH: From @image1's exact position, [the walker] continues
forward past [landmark named in the route between the two waypoints], arriving
at @image2's exact framing as the leg ends.

PERFORMANCE VIBE: [energy from the DNA — brisk and confident / warm and
conversational], talking continuously through the walk, no pausing to deliver
the line then resuming.

DIALOGUE: Speaking with accurate lip sync and natural pacing while walking, the
person says: "[exact chunk, verbatim from 03-rebuild.md]"

VOICE: [texture, age, accent — verbatim, same block every clip in this ad].

TIMING: Line lands as the walker settles into @image2's framing; clip ends on a
completed word.

AUDIO / ENVIRONMENT SOUND: Realistic [store / street] room tone — [named
ambient sources], footsteps at a natural walking cadence, voice close and
present, not studio-polished. No music.

STYLE: Authentic TikTok/Reels walking UGC, raw smartphone footage, natural skin
texture, slightly imperfect realism.

NEGATIVE CONSTRAINTS: [pool above, tuned to this leg].
```

### Adsora Gen variant (chained `i2v`, native audio)

Follow `talking-head-long-form.md` §2 verbatim for the chunk/seed/chain/concat
mechanics, with the seed frame for each chunk coming from that chunk's own
waypoint still (§2 above), and the ROUTE LOCK block appended to the standard
scene + presenter + accent + beat-direction prompt for every chunk. Build the
route sheet (§2) alongside the joins sheet before sending.

## Assembly notes

Generate: establishing plate (reference only) → Waypoint stills in route order →
legs in cut order, each a continuation of the previous leg's last frame. Open on
the hook leg. If a paused product-pickup beat is used, insert it as its own clip
between two legs and cover the walk/stop transition with a hard cut, not a
blend. Burn centered captions. CTA leg is the one place the walker may plant and
face the lens directly, if the DNA calls for a direct-address close.
