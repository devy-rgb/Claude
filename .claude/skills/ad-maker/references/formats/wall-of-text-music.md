# Format Module — Wall of Text + Music

The whole ad is one block of story copy, centred over a slow, calm background
clip, with a music bed and nothing else — no voice, no captions, no face. The
viewer reads it in eight to twelve seconds and it loops. It is a text post that
learned to move, and it is the cheapest format in the engine after faceless.

**Engine stack:** none required. Background = one clip from the house b-roll
folders (a slow aerial, water, a road, a timelapse) or, when nothing fits, **one**
Seedance text-to-video clip through the default adapter. Text and music are
laid on by `tools/assemble.mjs` (`loop`, `dim`, `blur`, `text` with `fill`,
`music`). Read `references/edit-assembly.md` §3 for the fields.

---

## When this format fits the DNA

- **The competitor ad is copy.** A long-form story post, a "my buddy told me
  this" testimonial, a screenshot-of-a-post ad. The persuasion is in the
  words; the picture only keeps the thumb still.
- **The hook is a first-person sentence** with a number in it.
- **Volume and speed.** Ten hook variants render locally in a minute; it is
  the right first test of a new angle before anything with a face is spent.
- **Retargeting** — a viewer who already knows the product reads faster than
  they listen.

Do not pick it for a mechanism that needs showing, a demonstration, or any DNA
whose winning element is a person's delivery.

---

## What Stage 4 produces (no model prompts)

### 1. The text block

Write it as the ad, not as a script. The block is sized by the renderer to
**fill 80% of the frame** from the line breaks you write, so short lines are
what make the type big:

1. **45–70 words, 16–20 text lines, a blank line between beats** (20–25 lines
   in all). **No line over ~22 characters** — three or four words. At
   1080×1920 that lands the type at roughly 70–80 px; a 30-character line
   drags the whole block down to ~55 px because the widest line sets the size.
2. **Line 1 is the hook** — first person, a specific number, a tension
   ("...but felt trapped"). It is the only line most viewers read, so it is
   written last and tested first.
3. **One quoted line in the middle** — what someone said to them. Quotation
   marks read as testimony.
4. **Beat order = the DNA's beat order**: hook → the turn (who / what told
   them) → the action ("So I did.") → the result with a number and a time
   frame → the CTA as the last line ("Check out [BRAND]. 100% free.").
5. **Digits, not words.** This is read, not spoken: `$169k`, `9 months`, `3`.
6. **Every line breaks where the eye pauses.** Write the line breaks yourself
   (`\n`); do not leave wrapping to chance. Blank line between paragraphs.
   Count the characters of the longest line before you move on.
7. NESB and the banned-pattern list still apply (`copywriting-core.md`) —
   short lines punish filler harder than speech does.

### 2. The background brief

One clip, 6–15s, that **loops or holds without drawing the eye**:

- Slow, continuous motion: a drone drifting over fields or coast, water, a
  road from a car, clouds, a city from a rooftop at dusk, a timelapse.
- Low detail in the middle of the frame, **no readable text, no faces, no
  logos, no landmarks**. Tone does not matter much — the assembly dims and
  softens it under the type (rule 2) — but a shot that is already mid-to-dark
  needs less of that and keeps more of its picture.
- Vertical or centre-croppable. Say which house folder to draw from
  (`~/Documents/Adsora/Video Assets Raw/B-Roll/<niche>` or the hooks folder), or
  write the one Seedance prompt: *"slow aerial drone shot drifting forward
  over green farmland at golden hour, no people, no buildings, no text,
  steady, 10 seconds"*.
- Match the mood to the copy, not the product: the story about quitting a
  job wants open sky, not the product.

### 3. The jobs file

`06-finals/wall-of-text-music/assemble.json`, written in Stage 4, run in
Stage 5:

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/wall-of-text-music",
  "aspect": "9:16",
  "size": "1080x1920",
  "font": "Gotham Black",                       // heavy sans; Arial Black where Gotham is not installed
  "captions": false, "disclosure": false, "banner": false,
  "musicDir": "~/Documents/Adsora/Video Assets Raw/Soundtracks",   // cleared beds only
  "musicVolume": 0.18,                          // no voice to sit under — the bed is the sound
  "jobs": [{
    "name": "wall-of-text__hook-1",
    "clips": [{
      "file": "~/Documents/Adsora/Video Assets Raw/B-Roll/<niche>/<slow-aerial>.mp4",
      "loop": true, "seconds": 10, "mute": true,
      "dim": 0.5, "blur": 4,                    // black scrim + softened detail: the type is always the brightest thing on screen
      "text": [{
        "text": "I made $169k a year\nbut felt trapped.\n\nMy buddy who owns\n3 Airbnbs told me:\n\n\"Stop wasting time\non Zillow.\nSubscribe to [BRAND].\nThey send you the\ndeals worth buying.\"\n\nSo I did.\n\n9 months later, my\nSTR cashflow covers\nmy mortgage...\nand paid for a family\ntrip to Italy.\n\nCheck out [BRAND].\n100% free.",
        "anchor": "middle", "fill": 0.8, "outline": 4, "shadow": 2
      }]
    }]
  }]
}
```

Hook tests are more jobs in the same file: same clip, same music, a different
first line. Name them `wall-of-text__hook-N`.

---

## Production rules

1. **Everything is on screen from frame one.** No typewriter, no line-by-line
   reveal, no animation. The reader sets the pace; the loop gives slow readers
   a second pass.
2. **The type is distinct from the picture, always.** Three things make that
   true and all three are required:
   - **Weight and face:** one heavy plain sans — Gotham Black (the house face;
     Arial Black where it is not installed). Never a regular or light weight,
     never a serif, script or condensed face; at 22-character lines the
     heavy weight is what reads at arm's length.
   - **Fill and edge:** white text (`color` `#FFFFFF`), thick black `outline`
     4 (6 px at 1080p), `shadow` 2. Never a colour that lives in the shot.
   - **The background under it is dimmed and softened:** `dim` 0.5 and `blur`
     4 on the clip. Raise `dim` to 0.6–0.7 on a bright sky or snow; drop to
     0.35 on a shot that is already dusk-dark. The scrim is what guarantees
     the contrast on every frame, not the outline — a busy or bright clip with
     no `dim` is a failed render even if one frame looks fine.
3. **8–12 seconds.** Shorter than the slowest read of the block; the loop
   handles the rest. `seconds` on the clip, `loop: true` if the source is
   shorter.
4. **Music at a real level.** There is no voice to protect, so the bed sits at
   0.15–0.25 — chosen calm (lo-fi, soft piano, ambient), cleared, never a
   trending song.
5. **No captions, no banner, no disclosure, no legal box** — even when the
   copy shows a dollar figure (hard rule 14). If the user asks for a legal line
   in that run, add their wording as a small boxed `text` at
   `anchor: "bottom"`, `y` 0.93, `size` 16.
6. **The block fills 80% of the frame.** `anchor: "middle"` + `fill: 0.8`:
   the renderer picks the largest type whose lines span 80% of the height and
   whose longest line stays inside 80% of the width, leaving 10% clear top and
   bottom for platform UI. Do not set `size` or `marginX` by hand on the wall;
   change the line breaks instead. If `--plan` reports the fitted size under
   ~65 px at 1080p, a line is too long — break it.
7. **Never a face, never the product** in the background — the format's
   credibility is that it looks like a person's post, not an ad.

## Negative constraints (checks on the clip and the copy — there is no prompt)

- no readable text, signage, faces, logos or landmarks in the background clip;
- no cut inside the background clip (one shot, or one seamless loop);
- no claim in the block that `03-rebuild.md` does not substantiate;
- no line over ~22 characters — it shrinks every other line with it;
- no wall without `dim` on its clip, no wall in a light or regular weight, no
  wall whose block spans under 75% of the frame height;
- no unlicensed music.

## Assembly note

The jobs file *is* the assembly. Render with `--plan` first — it prints the
seconds and, for the wall, the fitted size, line count and longest line
(`fill → 78px, 22 lines, longest 21 ch`) — then render, then frame-check at
1 fps: the block spans ~80% of the height (fail under 75%), no line has
wrapped onto a second line (a wrap means a line over the width share — break
it in the copy), and at a 25% zoom every letter still separates cleanly from
the picture behind it. Log it in the Stage 5 cost table at `$0.00`; if a
Seedance background was generated, that one clip is the only spend.
