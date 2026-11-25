# Format Module — Moving Background + Voiceover + Text

One continuous moving shot — an FPV drone skimming rice terraces, a dashcam
road, a walk through a market, a slow push over a coastline — under a calm
voiceover, with one to three words of the script centred on screen at a time.
No face, no cuts, no b-roll montage. The picture is hypnotic enough to hold
the thumb and empty enough that the words are all the viewer takes in.

**Engine stack:** voice = `tools/faceless.mjs --vo-only` (Kokoro house reads —
`am_adam` at 1.1 or `af_sarah` at 1.2 — or a Chatterbox clone via `refAudio`);
background = one long clip from the house b-roll / hooks folders, or **one**
Seedance 2.5 text-to-video take (15–30s) through the default adapter;
assembly = `tools/assemble.mjs` (`loop`, `audio`, `script`, plain captions).
Read `references/faceless-video.md` (the voice) and
`references/edit-assembly.md` §3 (the fields) first.

**How it differs from `faceless-vo-broll`:** that format packs many b-roll
clips with crossfades under the voice; this one is a single unbroken shot
with the captions in the centre of the frame. Reach for it when a montage
would read as "an ad" and one shot reads as "a clip somebody posted".

---

## When this format fits the DNA

- **Fact-hook / credibility DNA** — "the fact that [big number] [credible
  group] do X every day is insane, but it's true". Newsletters, apps, tools,
  memberships, anything sold on who already uses it.
- **Announcement / news-hook** ads and "here's what changed" explainers.
- **B2B and professional audiences** who tune out UGC faces but will read
  captions over a nice shot.
- **Volume** — twenty hooks over one body is one VO job each and one shared
  background.

Skip it when the persuasion needs a person (testimonial, confession) or a
demonstration.

---

## What Stage 4 produces (no face prompts)

### 1. The script, spoken-ready

- **40–70 words → 15–25s** at the house rate (~185 wpm). Write for the ear:
  contractions, one idea per sentence, no symbols, prices and dates as words
  (`faceless-vo-broll.md` §1 rules apply verbatim).
- **Sentence 1 is the whole hook**: the number, the group, the claim, the
  turn ("…is insane. But it's true."). Sentence 2 names the product plainly.
  Sentences 3–4 are the three things it does. Last sentence is the CTA plus
  the risk-reversal ("it's free, and there's no catch").
- No delivery directions in the text; the voice is chosen by `voice`.

### 2. The background brief (one shot)

- **Continuous motion, one take.** FPV or drone forward flight, a road from a
  car, a boat wake, a slow aerial push, a first-person walk. Medium speed —
  fast enough to feel alive, slow enough that nothing in it asks to be looked
  at.
- **Low detail at the centre** where the captions sit; mid-tone; a single
  palette (the reference ads are all one green). **No people, faces, text,
  signs, logos, landmarks, animals in the foreground.**
- **Length ≥ the VO, or loop-safe.** Prefer a clip longer than the read. If
  the only good clip is short, `loop: true` repeats it — pick one whose
  first and last frames are similar (a straight forward flight) so the seam
  is a soft jump, not a smash.
- Source order: house hooks folder
  (`~/Documents/Adsora/Video Assets Raw/Visual hooks/<niche>`, 5s AI openers) → house b-roll (`.../B-Roll/<niche>`) → one
  Seedance 2.5 text-to-video prompt when nothing fits (save that clip into the
  niche's hooks folder too, hard rule 16): *"first-person FPV
  drone flight low over terraced green rice fields toward misty hills,
  continuous forward motion, soft overcast light, no people, no buildings,
  no text, 25 seconds, 9:16"*.

### 3. The jobs files

Voice (`05-assets/moving-bg-vo-text/vo.json`):

```jsonc
{ "outDir": "./ad-remix-runs/<slug>/05-assets/moving-bg-vo-text",
  "voice": "am_adam", "speed": 1.1,
  "python": "~/.adsora/kokoro/bin/python",
  "jobs": [
    { "name": "vo__hook-1", "script": "[full script, hook 1]" },
    { "name": "vo__hook-2", "script": "[full script, hook 2]", "voice": "af_sarah", "speed": 1.2 }
  ] }
```

```bash
node tools/faceless.mjs 05-assets/moving-bg-vo-text/vo.json --vo-only   # → vo__hook-1.wav, manifest.json with voSec
```

Assembly (`06-finals/moving-bg-vo-text/assemble.json`):

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/moving-bg-vo-text",
  "aspect": "9:16", "size": "1080x1920", "font": "Helvetica Neue",
  "captions": { "style": "plain", "wordsPerCue": 2, "y": 0.52, "size": 44, "uppercase": false },
  "disclosure": false, "banner": false,
  "music": false,                       // the reference ads run dry; a bed at ≤ 0.05 is the most allowed
  "jobs": [{
    "name": "moving-bg__hook-1",
    "clips": [{
      "file": "05-assets/moving-bg-vo-text/background.mp4",
      "loop": true, "mute": true,
      "audio": "05-assets/moving-bg-vo-text/vo__hook-1.wav", "tail": 0.6,
      "script": "[the full script, verbatim — captions are the written words, timed by the heard ones]"
    }],
    "endCard": { "lines": ["[BRAND]", "Free. Link below."], "seconds": 2, "bg": "#0B3D2E" }
  }]
}
```

`loop: true` + `audio` with no `seconds` sizes the clip to the voice plus
`tail`. One job per hook; the background and captions config are shared.

---

## Production rules

1. **One shot, no cuts, no crossfades.** If the read outruns the clip, loop
   it; never cut to a second shot — that is `faceless-vo-broll`.
2. **Captions dead centre, 1–3 words, sentence case, plain.** `y` 0.50–0.55,
   `wordsPerCue` 2 (3 for a dense read), white with a 4–5px black outline, no
   box, no highlight colour. Uppercase off — this is a calm voice, not a
   yapper.
3. **The voice is the house read.** `am_adam` 1.1 / `af_sarah` 1.2, measured
   at ~185 wpm. A slow-feeling ad is the voice or the gaps, never the picture.
4. **Dry or nearly dry.** No music, or a bed at ≤ 0.05. The wind/engine of
   the shot is the sound design; keep the source audio only if it is clean
   (`mute: false`, `ambience` under the VO) — otherwise mute it.
5. **Nothing else on screen.** No banner, no disclosure (hard rule 14, and
   there is no person anyway), no product shot. The end card is the only other element,
   and only if the DNA has a named destination.
6. **Frame the centre empty.** When the only clip has a bright object in the
   middle, `zoom` 1.08 and check a frame — or pick a different clip.

## Negative constraints (checks on the clip and the script)

- no faces, people in the foreground, text, signage, logos, watermarks or
  recognisable landmarks in the shot;
- no cut or dissolve inside the clip; no strobing light;
- no unlicensed music; no trending audio;
- no claim in the script that `03-rebuild.md` does not substantiate; every
  number in the hook is real.

## Assembly note

`vo.json --vo-only` → read `manifest.json` for `voSec` → `assemble.json`
`--plan` (the clip's seconds should equal `voSec` + `tail`) → render → check
`heard` in the manifest against the script's numbers → 1-fps frame review
for a caption landing on a bright patch. The only spend is, if generated, one
background clip; caption timing is local whisper.cpp.
