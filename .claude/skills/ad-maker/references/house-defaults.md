# House defaults — the operator's measured settings

This file is the house overlay on the generic engine. Everything in it was
measured on real ads, not chosen by taste, and each rule names where it is
enforced so a rerun cannot quietly drift back to the generic default. The
generic, distributable copy of this skill does not carry this file; the
installed copy does, and its tools read these values as their defaults.

Four rules live here today: the faceless voice, the caption spec, the b-roll
pool, and the soundtrack pool. The rest of the house pacing (gaps, the 2.6s
hold, the punch-in alternation, open-and-close on the face) is already in
`references/edit-assembly.md` §4.

---

## 1. Voice — the faceless default is a preset, not a clone

Cloning exists for one reason: an **avatar-led** ad (talking-head, UGC yapper,
podcast) generates an on-camera person with a native voice, and the b-roll
voiceover has to be *that* voice or the ad reads as two people. So those
formats clone the avatar clip's own audio with Chatterbox
(`references/formats/talking-head.md`, "Avatar-led ad defaults").

A **faceless** ad has nobody on screen and therefore nothing to clone from.
It uses the house Kokoro preset, and it never clones unless the user hands
over a `refAudio`:

| Read | Preset | Speed | Why |
|---|---|---|---|
| Male (default) | `am_adam` | 1.1 | ~185 wpm, the direct-response band (180–200) |
| Female | `af_sarah` | 1.2 | Sarah reads slower than Adam; 1.2 lands ~184 wpm |

The numbers are measured, not aesthetic. On one identical line: `am_michael`
at 0.88 read at ~145 wpm ("too slow and unnatural"), `am_adam` at 0.88 at 166,
at 1.1 at 185, at 1.3 at 207 (rushed). Kokoro adds no leading or trailing
silence, so a slow-feeling ad is the voice or the gaps, never padding to trim.
If a read still drags, raise the speed toward 1.2 before touching anything
else. Any other preset gets rate-tested the same way before it ships: voice one
14-word line, divide. Samples of every preset:
`~/Documents/Adsora/Video Assets Raw/Voiceovers/Kokoro voice options/`.

**Where it is enforced:** `tools/faceless.mjs` (`HOUSE_VOICE`, `HOUSE_SPEED`
— the fallback when a job or config sets neither), `config/generators.json`
→ `routing.faceless_voice*`, and the jobs-file templates in
`references/faceless-video.md` and `references/formats/faceless-vo-broll.md`.

---

## 2. Captions — Gotham Black, sixteen-character cards, pause breaks

**Subtitles are always on, and they are the only on-screen text.** No script
carries an authored caption line, no format writes one, and no jobs file needs
a `captions` block to get them: every segment that speaks is subtitled in its
own spoken words. `"captions": false` is the single opt-out and is used only
when the operator asks for it in that run (hard rule 23). A clip's `script`
supplies the written line where there is one, which spells the words properly
and lets the corrections map repair them; a clip without a script is captioned
from what whisper hears. Muted clips, silent stills and end cards caption
nothing. Designed graphics (banner, end card, product label, comment bubble,
before/after label) are separate objects and are unaffected; the text-first
formats, where the type *is* the ad, keep their own copy.

The house caption look was measured off a reference ad and is shared by both
renderers through `tools/captions.mjs`, so the faceless path and the assembly
pass cannot drift apart:

- **Face:** `Gotham Black` (`~/Library/Fonts/Gotham-Black.otf`). Both tools
  fall back to `Arial Black` when the file is absent and say so; on a bare host
  install the font rather than accepting the fallback.
- **Cards:** one to three words, never more than sixteen characters. A new
  card at any pause longer than 0.45s and after every sentence end. Uppercase.
  White fill, black outline, the spoken word highlighted.
- **The words are the script's.** Caption text is the approved line, aligned
  to the transcript for timing. The corrections map in `tools/captions.mjs`
  repairs the words a transcriber reliably mangles (`remodellation`,
  `$9.99` for a nine-ninety-nine price, a stuttered article) *before*
  alignment, so timing lands on them instead of drifting past them. It runs on
  the heard words only; it never rewrites what the script says. Add a rule when
  a run shows a new artifact, with an `after` / `before` guard if the misheard
  token is also a real word.
- **Timings are made monotonic before chunking** (2026-09-12). Whisper's aligned word
  timings can run backwards at a boundary; `chunkCues` orders them (a word starts no
  earlier than the previous word ends) and clamps each card to the next card's start,
  or two cards render at once. Check any final with the overlap scan (count `Cap`
  events whose start precedes the previous event's end) before shipping.
- **Timing is local.** `whisper-cli` (whisper.cpp, `brew install whisper-cpp`)
  with `~/.adsora/whisper/ggml-large-v3-turbo.bin` times the heard words on
  this machine: no transcription API, no key, no spend, about 3 s per 45 s of
  audio. Search order: `whisperModel` in the jobs file → `WHISPER_MODEL` → the
  house folder (large-v3-turbo, small.en, base.en). The manifest's
  `captionTiming` is `local`, `even` (whisper missing, captions spaced evenly)
  or `mixed` (one clip failed).

Config keys (both tools): `maxWords` (3), `maxChars` (16), `pauseBreak`
(0.45); `wordsPerCue` still works as an alias for `maxWords`. Position and
size stay per format (`y`, `size` / `captionSize`), because a banner or a
half-frame insert decides where the cards can sit.

**Where it is enforced:** `tools/captions.mjs` (`chunkCues`,
`applyCorrections`, `houseFont`, `whisperStatus`, `heardWords`), imported by
`tools/faceless.mjs` and `tools/assemble.mjs`.

---

## 3. B-roll — screen the pool once, then draw from it deterministically

Both renderers draw from a folder. A clip with baked-in text, a watermark, a
"SUBSCRIBE" overlay or a competitor's logo will end up under the voice sooner
or later unless the folder is screened first.

**Screen once, by eye.** `tools/broll-pool.mjs <dir>` probes every clip, drops
anything under 1.4s, and writes a numbered contact sheet of one mid-clip frame
per clip. Read the sheet, then rerun with `--drop 4,11,17` (or `--keep …`) to
write `broll-pool.json`: the survivors, as `{ n, file, dur }`. Point the
render at it (`brollPool` in a faceless jobs file; `brollPool` or a clip's
`broll.pool` in an assembly jobs file) and only those clips are used. Keep the
pool file in the run folder so the run log shows what was screened.

**Same line, same picture.** A hook test is one body with different openers.
It only reads as a test if the body is identical, so footage is chosen
deterministically:

- `assemble.mjs`: a clip's auto-tiled cutaways are seeded by its `script`
  line, so the same line draws the same footage in every variant. A clip is not
  reused within one ad until every usable clip has been drawn once.
- `faceless.mjs`: the montage is seeded by the job name up to `__`, so
  `<script>__<hook>` jobs share one montage and only the opener differs. Set
  `seed` on a job to force a different draw.

**Where it is enforced:** `tools/broll-pool.mjs`; `tile()` and the `broll`
block in `tools/assemble.mjs`; `brollPool` and the montage seed in
`tools/faceless.mjs`.

---

## 4. Soundtracks — the bed comes from the house music pool

Every video the user asks for — a full remix run, a one-off cut, a re-edit —
gets its music bed from the house pool first, not from a fresh download (hard
rule 20, which widens rule 16 to soundtracks and to any create/edit-video ask).
Only reach outside the pool when nothing in it fits, and only with a cleared bed
(edit-assembly.md §9: no unlicensed music). When nothing fits, the cleared bed is
**generated locally** with `tools/song.mjs` (ACE-Step; no UI, no API, no
per-track cost) — a locally generated track is yours, so it satisfies §9 — and
the new bed is saved back into `Soundtracks/` so the next run finds it. The one
format where a generated song is the *whole audio*, not a bed, is the cartoon
music video ad. Full spec: `references/song-maker.md`.

**Every track in the pool is cleared for paid ads** (the operator's call). Pick by
ear; no licence file is needed for anything in this folder.

**The pool.** `~/Documents/Adsora/Video Assets Raw/Soundtracks/` — a flat folder of
`.mp3`/`.m4a`/`.wav`/`.aac` files, **not** niche-organized (unlike `B-Roll/` and
`Visual hooks/`, which are foldered by niche). Pick by ear to match the ad's
energy: the melodic-trap and confident-anthem beds carry direct-response reads
well; the named tracks are moods to reach for when a specific feel is asked.

**How it is laid in.** Both renderers already take the bed as a path and hold it
under the voice at a fixed gain with fades — never ducking. Set it per job:

- `tools/assemble.mjs`: `"music": "/abs/path/bed.mp3"` (or `"musicDir"` to rotate
  one bed per job), `"musicVolume"` default `0.06`; music-forward formats
  (wall-of-text-music, dance-big-text) run `0.15–0.25`.
- `tools/faceless.mjs`: `"musicDir"` rotates one bed per job across the batch,
  same `musicVolume`.

A bed that fights the read was chosen too loud — lower `musicVolume`, do not add
ducking (edit-assembly.md §8). Point `music` / `musicDir` at the pool folder (or
a specific file in it) so the run log shows which house track was used.

**Where it is enforced:** `music` / `musicDir` / `musicVolume` in
`tools/assemble.mjs` and `tools/faceless.mjs`; `references/edit-assembly.md`
§8–§9; SKILL.md hard rules 16 and 20.
