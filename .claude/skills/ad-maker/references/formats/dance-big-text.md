# Format Module — Dancing Person + Big Text Callout

One continuous clip of people celebrating — dancing, hopping, an install crew
whooping in front of the finished work, someone waving an envelope by the
mailbox — with the whole claim or offer in big bold text across the top of the
frame, a CTA near the bottom, and a music bed. No voice, no lip-sync, no cuts,
**no subtitles**. The text is the ad; the people are proof of feeling.

**House footage first (hard rule 20).** A real clip of a crew or a homeowner
celebrating — `Visual hooks/<NICHE>/` then `B-Roll/<NICHE>/` under
`~/Documents/Adsora/Video Assets Raw/` — beats a generated one in this format,
because the only thing the picture has to do is read as real people who are
genuinely pleased. Generate only when the library has nothing that fits.

**Engine stack (when generating):** one Nanobanana Pro still (the person at the
moment *before* the celebration) → **one** Seedance 2.0 image-to-video clip, 10–15s, through the
default adapter (Adsora Gen i2v works too when its keys exist — there is no
dialogue, so either is fine). Text via `tools/card.mjs` (`headline`) and
`tools/assemble.mjs` (`overlays`, `text`, `loop`, `music`). Read
`references/edit-assembly.md` §3 and `references/production-discipline.md`
§3–§4 first.

---

## When this format fits the DNA

- **A single big result claim** — "got $X", "paid $0", "approved in 2 days",
  "didn't have to [feared thing]" — with a CTA. The DNA is one sentence long;
  every other beat is implied by the joy.
- **A single price or offer** — "$1,799 for 10 new windows + free installation",
  "brand-new gutters, no cost if qualified". The home-services flavour of the
  same machine: the crew or the homeowner dances in front of the finished work
  and the offer block does all the selling. Third-person brand voice here, not
  first-person confession.
- **Refund / settlement / payout / prize / approval** categories, and any
  offer where the *outcome* is the hook.
- **The competitor ad is exactly this** (a dancing person under a text
  callout). Transplant the claim shape word for word; change the product.
- Cheap **hook tests**: same clip, five different top lines.

Skip it when the DNA needs a mechanism explained or an objection handled —
there is no voice to do it.

---

## What Stage 4 produces

### 1. The text (three pieces)

| Piece | Rules |
|---|---|
| **Top callout** | the whole claim, **3 lines, ≤ 12 words a line**, first person, colloquial ("y'all", "&", "lol" are allowed if the avatar talks that way). A number in line 2. The feared thing negated in line 3 ("& I didn't have to sue or go to court"). |
| **Bottom CTA** | one line, ≤ 14 words: "Click below to find out how much you could be owed :)" |
| **Legal box** | none by house rule (hard rule 14). Only if the user asks for one in that run: 25–45 words in their wording, appearing from ~3s so it does not compete with the hook. |

Digits, not words. Line breaks written by hand.

### 2. The person and the clip (one still, one clip)

**Still (Nanobanana Pro, the moment before):** `Hyper realistic candid UGC
phone-propped shot ONLY (no bokeh, no portrait mode):` a [locked person] on a
[driveway / porch step / curb by a mailbox / apartment corridor] holding [a
sealed envelope / a folded letter / a set of keys / a small box] at chest
height, weight on one foot, mouth open in the first second of a laugh, about to
move. Bright, plain wardrobe (a solid colour) so the text over them stays
readable. Full body or knee-up, phone propped low, daylight, deep focus. *No
readable text on the envelope. No phone visible.*

**Clip (Seedance 2.0 prose, 12s, from that still as `@Image 1`):** *one
continuous action* — she reads it, gasps, and breaks into a loose happy dance
on the spot: a two-step, a spin with the envelope held up, a jump, a hand over
the mouth, then back to a bounce; the camera is a propped phone that does not
move; a neighbour's hedge and a parked car stay still in the background;
natural daylight; **no speech, no lip movement that reads as words**, only a
laugh; ambient street sound. She ends in roughly the pose she started in, so
the clip loops.

### 3. The jobs files

Cards (`05-assets/cards/cards.json`, rendered by `tools/card.mjs`):

```jsonc
{ "outDir": "./ad-remix-runs/<slug>/05-assets/cards", "scale": 1,
  "cards": [
    { "name": "callout", "kind": "headline", "width": 1000, "size": 50,
      "text": "Didn't go to the ER but still got\n$82,000 for my car accident y'all\n& I didn't have to sue or go to court" }
    // lines never re-wrap (nowrap): ~36 characters fit 1000px at size 50 — shorten a line that overflows
  ] }
```

Assembly (`06-finals/dance-big-text/assemble.json`):

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/dance-big-text",
  "aspect": "9:16", "size": "1080x1920", "font": "Helvetica Neue",
  "captions": false, "banner": false, "disclosure": false,
  "musicDir": "~/Documents/Adsora/Video Assets Raw/Soundtracks", "musicVolume": 0.22,
  "jobs": [{
    "name": "dance-big-text__hook-1",
    "clips": [{
      "file": "05-assets/dance-big-text/clip-1.mp4", "loop": true, "seconds": 12, "mute": true,
      "overlays": [{ "file": "05-assets/cards/callout.png", "x": 40, "y": 150, "w": 1000 }],
      "text": [
        { "text": "Click below to find out how much\nyou could be owed for your accident :)", "anchor": "bottom", "y": 0.80, "size": 40, "outline": 4 }
        // no legal box (hard rule 14). Only if the user asks for one in this run, in their wording:
        // { "text": "[their wording]", "anchor": "bottom", "y": 0.905, "size": 19, "box": "#5A5A5A", "boxAlpha": 64, "pad": 10, "marginX": 80, "from": 3 }
      ]
    }]
  }]
}
```

The callout can also be done with `text` alone (`anchor: "top"`, `y` 0.08,
`size` 50, `outline` 5, `font` "Helvetica Neue") — use the card when the type needs the browser's
tighter stroke and shadow, the `text` route when you want to A/B five
callouts without re-rendering PNGs.

---

## Production rules

### HARD RULE — the offer is on screen from the first frame, and there is always a CTA

This format has no voice, so nothing gets explained and nothing gets subtitled.
That makes two things non-negotiable:

- **The offer is legible in the opening frame and held for the whole
  runtime.** Not revealed at three seconds, not animated in, not saved as a
  payoff. Someone who sees a single frame of this ad has already read the
  offer. It is the top block, in the largest type in the frame: the price, the
  number, or the thing being given away — *"Only $1,799 for 10 NEW WINDOWS +
  FREE Installation?"*, *"This November, seniors 50 and older could get
  approved for brand-new gutters — no cost if qualified!"*
- **A CTA is always on screen.** Either a bottom line ("Click below to see if
  your zip qualifies") or a rendered button card ("✔ CLAIM YOUR GUTTER
  OFFER!"). A held offer with no CTA is not this format.

**Never subtitles.** `"captions": false` in the assembly file every time. There
is no speech to caption, and a caption track would fight the offer block for the
same pixels. This is the standing carve-out from hard rule 23 — the type *is*
the ad, so it is authored in Stage 4 rather than burned from audio.

1. **Text top and bottom, person in the middle.** Callout in the top 30%,
   CTA at ~80%. The person's face lives in the middle 40% — frame the still
   so it does (knee-up, subject slightly low).
2. **One continuous clip, no cuts.** The format's honesty is that it looks
   like a single phone video someone posted. `loop: true` covers a clip
   shorter than the music needs.
3. **No speech.** A laugh, a gasp, a "yes!" shape are fine; a sentence turns
   it into a lip-sync problem. `no dialogue, no talking` in the constraints.
4. **The prop is blank.** Envelope, letter, check — held up, waved, kissed,
   never readable. The number lives in the callout, nowhere else.
5. **Bright wardrobe, quiet background.** Solid colour clothes; a street, a
   porch, a hallway; nothing moving behind them; no other people.
6. **Music is the sound.** Upbeat, cleared, at 0.18–0.25. No trending tracks.
7. **No legal box and no `disclosure` line** (hard rule 14), even when a
   figure is shown. Add one only if the user asks for it in that run.
8. **10–15 seconds.** The claim is read in three; the rest is the loop and the
   feeling.

## Negative constraints (`constraints:` clause on the one clip)

```
constraints: no dialogue, no talking, no readable text anywhere in frame, the
envelope stays blank, no phone or camera visible, no other people, nothing
moving in the background, no camera movement, no spinning camera, no
morphing hands, the envelope keeps its shape, no wardrobe change, preserve
the person's identity, no logos, no beauty filter, no cinematic colour grade,
no captions, no subtitles.
```

## Assembly note

Render cards → `--plan` → render → frame-check at 1 fps that the callout
never covers the face and the CTA clears the bottom safe zone. One hook test
= one more job with a different `callout` card (or `text` line); the clip and
music are shared. Log the one clip as the only spend.
