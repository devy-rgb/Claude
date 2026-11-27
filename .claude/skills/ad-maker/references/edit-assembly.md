# The edit — cutting generated clips into finished ads (the skill does this)

A generated clip is not an ad. The deliverable of every format is a finished
MP4: clips hard-cut in script order, b-roll over the talking parts where the
assembly note calls for it, karaoke captions timed to the actual audio, the
persistent banner, any product-label overlay, any repaired voice line, and the
end card. No disclaimer line goes on any final (hard rule 14).

**The skill performs that edit itself**, locally, with `tools/assemble.mjs`
(ffmpeg, no build step). It never hands the user a CapCut to-do list, never
writes "add captions in the editor", never leaves "cut b-roll over T2 to T4" as
an open item. Wherever this skill's references say *in post*, *in the edit*, *in
the editor*, or (in the older house-workflow docs) *CapCut*, read: **the
assembly pass, run by the skill in Stage 5.**

What the pass does **not** do is re-time or re-cut performances: voice, accent,
gaze, camera and pacing are locked into the generations, exactly as the house
playbook says. The edit is cut + caption + card + overlays, nothing more.

---

## 1. Setup (once per machine)

```bash
brew install ffmpeg whisper-cpp
mkdir -p ~/.adsora/whisper && curl -L -o ~/.adsora/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

Word timings for the captions come from that local whisper.cpp model
(`tools/captions.mjs`: `whisperStatus` / `heardWords`), so the pass needs no
API key and spends nothing: about 3 s per 45 s of audio on Apple silicon, and
nothing leaves the machine. Model search order: `whisperModel` in the jobs
file, then `WHISPER_MODEL`, then `~/.adsora/whisper/` (large-v3-turbo, then
small.en, then base.en). Without `whisper-cli` or a model the pass still runs
and captions still burn, spaced evenly across each clip instead of timed to
speech; the manifest records `captionTiming: "even"` (`"local"` when timed) so
the delivery can say so. Fonts resolve by name
through fontconfig plus `~/Library/Fonts`; the house caption face is `Gotham Black`
(`tools/captions.mjs` picks it when `Gotham-Black.otf` is installed and falls
back to `Arial Black` with a console warning otherwise). On a bare Linux
host, install a bold sans and name it in `font`.

---

## 2. Run it

```bash
node tools/assemble.mjs 06-finals/<format>/assemble.json --plan   # durations + timeline, no render
node tools/assemble.mjs 06-finals/<format>/assemble.json          # render
```

`tools/assemble.example.json` is a working template. One jobs file per format
lives in the run folder at `06-finals/<format>/assemble.json`; the finished ads
land beside it, plus a `manifest.json`. A failed job does not stop the others.

Paths resolve against the working directory (the folder the run lives in), and
`~` expands.

---

## 3. The jobs file

```jsonc
{
  "outDir":  "./ad-remix-runs/<slug>/06-finals/talking-head",
  "aspect":  "9:16",                        // 9:16 → 720x1280 · 1:1 → 1080x1080 · 16:9 → 1280x720
  "size":    "1080x1920",                   // optional; overrides the aspect preset for 1080p finals
  "fps":     24,
  "font":    "Gotham Black",               // optional; the house face is the default when installed
  "brollPool": "./ad-remix-runs/<slug>/broll-pool.json",   // optional; screened survivors for every `broll` block

  "captions":   { "style": "karaoke", "maxWords": 3, "maxChars": 16, "pauseBreak": 0.45, "y": 0.80, "highlight": "#FFE600" },
  "banner":     { "lines": ["BATHROOM", "REMODEL = $1,799"], "y": 0.42, "box": "#D32F2F" },
  "disclosure": false,                     // house rule: no disclaimer; { "text", "y": 0.94 } only if the user asks
  "endCard":    { "lines": ["Comment REMODEL", "for the details"], "seconds": 3, "bg": "#000000" },
  "music":      "/abs/path/bed.mp3",        // or "musicDir" to rotate one cleared bed per job
  "musicVolume": 0.06,

  "jobs": [{
    "name": "talking-head-final",
    "clips": [
      { "file": "05-assets/talking-head/final/clip-t1.mp4",
        "script": "Total bathroom renovation for seventeen hundred ninety-nine dollars. Yeah, we're doing it." },
      { "file": "05-assets/talking-head/final/clip-t2.mp4", "script": "…",
        "broll": { "dir": "~/Documents/Adsora/Video Assets Raw/B-Roll/BATH", "from": 0.8, "to": -1.2, "hold": 2.4 } },
      { "file": "05-assets/talking-head/final/clip-t3.mp4", "script": "…", "zoom": 1.08,
        "cutaways": [{ "file": "/abs/finished-room.mp4", "at": 1.0, "seconds": 2.2 }] },
      { "file": "05-assets/talking-head/final/clip-t4.mp4", "script": "…",
        "audio": "05-assets/repairs/t4.wav", "ambience": 0.15 },
      { "file": "05-assets/broll/hero.mp4", "mute": true, "seconds": 1.0 },
      { "split": { "top": "before.png", "bottom": "after.mp4", "seconds": 4, "labels": ["BEFORE", "AFTER"] } },
      { "file": "05-assets/product.png", "seconds": 2,
        "overlays": [{ "file": "05-assets/label.png", "x": 120, "y": 640, "w": 480 }],
        "text": [{ "text": "REAL LABEL, REAL PRODUCT", "y": 0.12, "size": 44 }] },
      { "file": "05-assets/moving-bg-vo-text/background.mp4", "loop": true, "mute": true,
        "audio": "05-assets/moving-bg-vo-text/vo.wav", "tail": 0.6, "script": "…" },      // one shot looped under a voice
      { "file": "05-assets/ugc-tiktok-comment/clip-1.mp4", "script": "…",
        "overlays": [{ "file": "05-assets/cards/reply.png", "x": 60, "y": 150, "w": 900, "to": 6.5 }],
        "cutaways": [{ "file": "05-assets/cards/stat.png", "at": 7, "seconds": 2.5, "region": "bottom" }] },
      { "file": "05-assets/bg/aerial.mp4", "loop": true, "seconds": 10, "mute": true, "dim": 0.5, "blur": 4,
        "text": [{ "text": "I made $169k a year\nbut felt trapped.\n\n…", "anchor": "middle", "fill": 0.8, "outline": 4, "shadow": 2 }] }
    ]
  }]
}
```

Every top-level block (`captions`, `banner`, `disclosure`, `endCard`, `music`,
`musicVolume`) can be overridden per job, or switched off per job with `false`.

### Per clip

| Field | What it does |
|---|---|
| `file` | a video, or a still (png/jpg) held for `seconds` |
| `script` | the words spoken in **this clip**, verbatim from `03-rebuild.md` → captions. Omit on b-roll, stills, silent cutaways |
| `in` / `out` / `seconds` | trim. `seconds` caps the length (use it to drop a lip-sync model's idle tail) |
| `loop` | repeat a short background clip: for `seconds`, or — with `audio` and no `seconds` — for the length of that audio plus `tail` (0.4s). A 5s drone shot under a 20s read; a still with `audio` sizes itself the same way |
| `mute` / `volume` | silence the clip's own track, or scale it |
| `audio` + `ambience` | replace the track (an ElevenLabs-repaired line); `ambience` keeps the original under it at that gain so the room tone survives |
| `zoom` | punch-in (1.08 / 1.26 alternate between consecutive face clips so two talking lines read as a cut) |
| `fit` | `cover` (default, centre-crop to fill) or `pad` (letterbox) |
| `dim` / `blur` | darken the picture under a black scrim (0–1) and/or soften it (gaussian sigma) so on-screen `text` is distinct from it whatever the shot — the wall of text sits on `dim` 0.5 + `blur` 4 |
| `cutaways` | b-roll (or a still) laid over this clip at `at` for `seconds`; the clip's audio is untouched. `region` `"full"` (default) / `"bottom"` / `"top"` / `"left"` / `"right"` puts it in one half of the frame — the proof insert under a talking face. `captionY` moves the captions that overlap it to that height: a card or screen with its own text (gate 3 fails a caption landing on it, CAPTION-COLLISION) |
| `broll` | auto-tiled cutaways from `dir` and/or `files`, between `from` and `to` (negative `to` = seconds before the clip's end), each `hold` long, `gap` seconds of face between them, `exclude` by filename, optional `region`. `pool` (or top-level `brollPool`) restricts it to a screened `broll-pool.json` from `tools/broll-pool.mjs`. Seeded by this clip's `script` line, so the same line draws the same footage in every variant and a rerun is the same edit; no clip repeats within the ad until every usable one has been drawn |
| `overlays` | PNGs at `x`/`y`, scaled to `w`, optional `from`/`to` — the real product label, a logo |
| `text` | on-screen lines for this clip: `text` (with `\n` line breaks), `size`, `anchor` `"top"` (default; `y` from the top) / `"bottom"` (`y` from the top, block grows upward) / `"middle"` (centred, `y` ignored), `align` `"center"` / `"left"` / `"right"`, `marginX`, `color`, `outline` (px) + `outlineColor`, `shadow`, `box` + `boxAlpha` + `pad` (a boxed pill instead of an outline), `font`, `uppercase`, `wrap` (`false` = only explicit breaks), `fill` (0–1, or `{ "w", "h" }`: auto-size the type so the whole block spans that share of the frame from the hand-written breaks — `--plan` prints the size it landed on; a `size` given too is a cap; `charWidth` / `lineHeight` / `blankHeight` tune the estimate), `from`/`to` — a title card, a caller-ID graphic, a whole wall of story text (`fill` 0.8), a CTA line, a legal box |
| `split` | a before/after stack of two files (stills or video), optional `labels`; vertical for 9:16, side-by-side otherwise |

**Segments are frame-exact.** Every segment lasts a whole number of frames, its
frames are numbered from zero, and its intermediate audio is PCM. Before 2026-09-13
a segment of `3.35` s carried 80 frames (3.333 s) and AAC audio that decoded to
3.371 s. The concat followed the audio, so each cut left a gap in the picture, and
the picture drifted ~7 ms per cut behind the caption timeline: 0.33 s by the end of
a 47-cut drama, with each subtitle changing before its shot. Gate 3 now matches
detected shot changes to the timeline (CUT-DRIFT).

### Captions

`style`: `karaoke` (default — only the active word is highlighted), `fill`
(words fill cumulatively, ASS `\k`), or `plain`. Cards follow the house spec in
`tools/captions.mjs`: Gotham Black, one to three words and at most sixteen
characters per card (`maxWords`, `maxChars`), a new card at any pause over 0.45s
(`pauseBreak`) or a sentence end; `wordsPerCue` is an alias for `maxWords`. Inside
each sentence the words go into the fewest cards that fit, balanced by length, and a
card never ends on "a", "the", "for" and the like. Greedy filling gave "It'll be up
in a" / "year.". A one-word fragment cut off by a pause joins its phrase. The
corrections map in the same file repairs known transcription artifacts before
alignment. `y` is the caption baseline as a
fraction of the frame height from the top (0.80 default; the talking-head
reference ad sat at ~0.68 under its banner). `highlight`, `color`, `size`,
`uppercase` (default true) are all overridable.

Captions are **the written words, timed by the heard ones.** Each clip's own
audio is transcribed and aligned to its `script` by edit distance, so a
transcriber writing "2026" for "twenty twenty-six" cannot drift the captions.
The caption text is always what was written. If a number in the manifest's
`heard` field disagrees with the script, the *clip* is wrong, not the caption —
that is the QA signal (see §5).

### Banner, disclosure, end card

- **Banner** — the persistent offer line(s) in a boxed pill, `y` from the top
  (0.42 default = upper third; on a mid-chest-up framing that can clip the
  chin, so check a frame and raise it to ~0.36 if it does). On screen from
  frame one to the last body frame; `"onCard": true` keeps it on the end card.
  **`y` is per-clip, not per-script or per-character** — a talking-head/UGC
  generation's framing (how high the head sits, how far it rises on a gesture
  beat) varies clip to clip even under an identical prompt template and the
  same presenter, so a value that clears one clip can sit across another's
  eyes (measured 2026-09-13, SKILL.md hard rule 26). After the first render,
  pull a full-resolution frame (not a downscaled contact-sheet tile — overlap
  that reads as "just above the head" at 240px wide is a hit across the
  eyebrows at 720p+) from the clip's tightest framing, usually a gesture beat
  where the head rises, and confirm the box clears it with margin. A tight
  chest-up framing often needs `y` 0.08-0.14 (near the top of frame, into the
  sky/background) rather than the 0.36-0.42 written for a looser shot. Do this
  per clip in a niche/character set — never assume sibling clips share a safe
  `y` just because they share a script.
- **Disclosure** — off. `"disclosure": false` in every assembly file; no
  "Dramatization" / "results vary" / legal line goes on any final, stylized
  testimonial or not (hard rule 14). Only if the user asks for one in that run:
  small, boxed, bottom safe zone (`y` 0.94), body clips only, their wording.
- **End card** — text-only on a solid `bg`, `seconds` long, music continues
  under it. Comment-bait CTA wording per the house playbook. Leave it out when
  the DNA has none.

### 3a. Cards — flat graphics through `tools/card.mjs`

Anything that has to *read* pixel-perfect is not generated and not drawn with
ASS: it is typeset as HTML/CSS and screenshotted to a transparent PNG by the
Chrome on the machine, then placed with `overlays`.

```bash
node tools/card.mjs 05-assets/cards/cards.json
```

```jsonc
{ "outDir": "./ad-remix-runs/<slug>/05-assets/cards", "scale": 1,   // 2 for 1080p finals
  "cards": [
    { "name": "reply", "kind": "comment",    "username": "maddie.k22", "text": "is it too late to qualify?", "width": 900, "size": 40 },
    { "name": "title", "kind": "notes",      "title": "3 things nobody told me", "lines": ["…", "…", "…"], "width": 720 },
    { "name": "hook",  "kind": "headline",   "text": "Didn't go to the ER but still got\n$82,000 for my car accident", "width": 1000, "size": 50 },
    { "name": "legal", "kind": "disclaimer", "text": "…", "width": 960 },   // only when the user asks for a legal line (hard rule 14)
    { "name": "page",  "kind": "html",       "html": "<div style=\"…\">a landing-page mock</div>", "width": 1080 }
  ] }
```

| Kind | What it draws | Used by |
|---|---|---|
| `comment` | the "Reply to @user's comment" sticker: white card, grey silhouette avatar, bold comment, tail. `theme: "dark"` for the dark variant | `ugc-tiktok-comment` — always an invented handle, never a real account |
| `notes` | an iOS-Notes list: white, black, numbered (`numbered: false` for dashes), optional `title` / `date` / `body` | the yapper's title card |
| `headline` | heavy sans, white fill, thick dark outline and shadow — or on a `box` colour; lines break only at hand-written `\n` (`nowrap: false` to wrap); `font` "Arial Black" opt-in, ~36 characters fit 1000px at size 50 | `dance-big-text` callouts, stat cards (`box: "#101820"`) |
| `disclaimer` | the grey legal box | only a run where the user asked for a legal line (hard rule 14: none by default) |
| `html` | anything — a landing-page mock, a chat screen, a receipt | the last beat of `ugc-tiktok-comment` |

The result is trimmed to the card's tight bounding box and `cards.json` in
`outDir` records each PNG's width and height, so `overlays` can be placed by
arithmetic: `x` = (frame width − `w`) / 2 centres it. A headline whose line
overruns its `width` is captured whole and flagged `overflow: true` — shorten
the line or lower `size` rather than shipping a callout that is wider than the
frame. No Chrome on the host → the tool exits with a message; approximate the
same graphic with `text` blocks (a boxed `text` is a legal box; an outlined
`text` at `anchor: "top"` is a callout) and say so once in the delivery.

---

## 4. Cut rules the pass enforces (from the house playbook and the measured house pacing)

1. **Hard cuts only** between clips. No crossfades, no dissolves — that is what
   sells a fast pace when no single clip has camera movement.
2. **No b-roll shot holds longer than 2.6s.** Long beats get more cutaways, not
   longer ones. `hold` 2.4 is the default; a list beat runs ~1.1s per item.
3. **Open and close on the face.** `broll.from` ≥ 0.8 and `broll.to` ≤ −1.2 on
   every talking clip; the last sentence of an emotional beat and the CTA nod
   stay on the speaker.
4. **Pin the offer-critical lines to the face** — price, scarcity, CTA — and let
   everything else go to b-roll.
5. **Alternate the punch-in** (`zoom` 1 / 1.08 / 1.26) between consecutive face
   clips so two talking lines in a row still read as a cut.
6. **Trim, never stretch.** A lip-sync model's ~0.5s idle tail is cut with
   `seconds` / `out`; time-stretching slides every mouth out of sync.
7. **Captions inside the platform safe zone**, in the house spec: Gotham Black,
   one to three words and at most sixteen characters per card, a new card at a
   0.45s pause or a sentence end, karaoke highlight — reads as real UGC
   captions, not ad subtitles (`references/house-defaults.md` §2).
8. **Music sits at a fixed gain and never ducks.** A bed that fights the read
   was chosen too loud: lower `musicVolume`. Talking-head ads often ship dry.
9. **Music comes from the house pool or `song.mjs`.** Any track in
   `~/Documents/Adsora/Video Assets Raw/Soundtracks/` is cleared for paid ads
   (the operator's call), and so is a track **generated locally** with
   `tools/song.mjs`. A bed pulled from anywhere else needs a `LICENSES.json`
   entry beside it; `qa.mjs final` checks only those.
10. **Never re-time a performance.** If a beat is wrong, re-roll the clip or
    swap its audio; the edit does not fix a generation.

---

## 5. Procedure inside Stage 5

1. **Write `06-finals/<format>/assemble.json`** straight from that format's
   Stage 4 assembly note: clips in cut order (the `-v2` re-roll where one
   exists), each talking clip's exact spoken words as its `script`, cutaways
   where the note says the picture leaves the face, `audio` on any repaired
   line, the banner / end-card text the note specifies, `"disclosure": false`.
2. **`--plan` first.** Check the total against the DNA's runtime band and that
   every talking clip has a script. Free, instant.
3. **Render.** Roughly real-time on a laptop for a 45s ad.
4. **QA from the manifest.** Every captioned clip carries `heard`: read the
   numbers, the price, the offer line. A wrong number there means a wrong clip;
   fix the clip (re-roll or `audio` swap), never the caption. Then a 1-fps frame
   review of the final for a pose snap that needs a cutaway, a b-roll clip with
   baked-in text or a watermark (add it to `exclude`), a caption colliding with
   the banner (move `y`).
5. **Log** one run-log line per final: clips, seconds, caption timing source,
   spend (none, timing is local; put `$0.00` in the cost table so the row count is honest).
6. **Deliver** the finals in `DELIVERY.md` as *finished ads*, with the raw
   clips still in `05-assets/` for re-cuts. A hook test is a second job in the
   same file with the hook clip swapped and everything else identical.

Faceless renders arrive from `tools/faceless.mjs` already captioned; pass them
through here only when the DNA needs a banner, an end card or a label they do
not have — with `"captions": false` on that job so they are not burned twice.

---

## 6. Per-format defaults

| Format | Cutaways | Banner | Disclosure | End card | Notes |
|---|---|---|---|---|---|
| talking-head, call-in | over the proof / mechanism clips | if the DNA has an offer line | no | comment-bait if the DNA has one | caller-ID / "call ended" via `text` |
| ugc-yapper | rarely; a title card via a `text` still | usually none | no | none | keyed background is a generation job, not an edit |
| podcast-duo, broadcast | the wide two-shot as a reaction cutaway | banner graphic already a still | no | optional | banner still → `overlays` |
| hot-seat, expert-in-the-moment | the silent listening cutaway (`mute`) | none | no | text-only comment-bait | before/after → `split` |
| pov-first-person | none (POV is one continuous eye) | none | no | optional | |
| pixar / lego / low-poly / paper / 2D | none | none | no | brand CTA | label → `overlays`, captions `plain` or `karaoke` |
| whiteboard | none | none | no | optional | garbled board label → `overlays` in a marker font |
| faceless-vo-broll | already cut | optional | no | optional | `captions: false` |
| street-interview | silent listening clip over the other speaker; product b-roll over the mechanism | none | no | comment-bait | one `script` per clip holds both lines |
| in-car-ugc | rarely; `region: "bottom"` insert for a mechanism beat | if the DNA has an offer line | no | optional | captions `y` 0.72 — tight framing |
| ugc-tiktok-comment | proof inserts `region: "bottom"` under the face; landing-page still last | after the bubble leaves | no | none (CTA on the face) | `overlays` bubble 0 → end of hook beat; captions `y` 0.55 |
| ugc-dialog | the listening clip over the definition line | none | no | optional | captions `plain`, sentence-level, `uppercase: false` |
| wall-of-text-music | none | none | no | none | `loop` + one `text` block `anchor: "middle"`, music 0.15–0.25, `captions: false` |
| dance-big-text | none | none | no (the reference ads' legal box is not added) | none | `loop`, headline card `overlays`, CTA `text` `anchor: "bottom"`, music 0.18–0.25 |
| moving-bg-vo-text | none (one shot) | none | no | optional | `loop` + `audio` + `script`, captions `plain`, 1–3 words, `y` 0.5, dry |
| cartoon-music-video | to the beat (fast in the chorus) | none | no | brand CTA over the outro | the generated song is the full audio: `music` = the song, `musicVolume` **1.0** (overrides §8); `captions: false` + lyric/karaoke cards on the chorus + hero HOOK/CTA cards |

Disclosure is "no" in every row by house rule (hard rule 14); it changes only
when the user asks for a line in that run.

---

## 7. Cost

Zero per ad, caption timing included (local whisper.cpp, no key). List each
final in the Stage 5 quote table anyway:

```
| talking-head final | assemble | local · tools/assemble.mjs | $0.00 |
```

---

## 8. When it fails

| Symptom | Cause | Fix |
|---|---|---|
| `ffmpeg 1: ... Fontconfig` or captions render in a fallback face | font name unknown to fontconfig | `fc-list \| grep -i "arial black"`; set `font` to an installed bold sans |
| Captions evenly spaced, not on the words (`captionTiming: even`) | `whisper-cli` or its model is missing — the console names which | `brew install whisper-cpp`; put `ggml-large-v3-turbo.bin` in `~/.adsora/whisper/` (§1); rerun |
| `captionTiming: mixed` on a job | whisper failed on one clip (no audio track, an empty or silent clip) and that segment fell back to even spacing | read the logged error; check the clip has speech; re-roll or `audio`-swap it |
| Caption words wrong | the script given as `script` is not what the clip says | captions are the written words: fix `script` to the approved line, and check `heard` — if the *clip* said the wrong thing, re-roll it |
| A cutaway shows black or freezes | b-roll shorter than `hold`, or `at` past the clip's end | the tiler skips clips under `hold`+0.2s; for explicit `cutaways` keep `at`+`seconds` inside the clip |
| Banner over the face | `y` too low for this framing | raise the banner (`y` 0.36) or lower captions (`y` 0.82) |
| Pose snap at a cut | consecutive clips start from the same anchor still | a 1–2s cutaway across the cut, or alternate `zoom` |
| Audio out of sync after an `audio` swap | replacement line longer/shorter than the mouth | regenerate the line to length; never time-stretch |
| Final is longer than the plan | a clip has no `seconds`/`out` and carries an idle tail | trim it |
| ffmpeg hangs at 0% CPU forever | not this script — it closes stdin and drops stdout for exactly this reason | if you fork the render, keep `-nostdin` and `stdio: ["ignore","ignore","pipe"]` |
| A looped clip shows a hard jump | the source's first and last frames differ | pick a straight forward-motion clip, or `in` a little past the start so the seam lands on similar frames |
| A `region: "bottom"` insert covers the mouth | the face clip was framed too low | re-roll from a higher-framed still (chest-up in the top half); the edit never crops a face |
| `card.mjs`: "no Chrome/Chromium found" | no browser on the host | install Chrome or set `CHROME_PATH`; otherwise approximate with `text` blocks |
| `card.mjs` takes ~30s per card | headless Chrome rendered but never exited (a fresh profile on macOS) | expected — the tool waits for the PNG, then kills the process; nothing to fix |
| A card PNG is the full page height | ffmpeg's alpha trim found nothing | the card has no opaque pixels (empty `text`), or ffmpeg is missing — check both |
