# Format Module — Cartoon Music Video Ad  *(authored for this engine)*

A short cartoon **music video**: an original catchy song — generated locally with
the song maker — cut to bright animated visuals, where the **song itself carries
the ad**. The hook is the intro line, the mechanism/benefit lives in the verses,
and the **offer + CTA sit in the chorus so they repeat**. It is the most
"scroll-stopping / earworm" format in the set: people finish it because the song
pulls them, and the CTA is stuck in their head after.

The **audio is a full song, not a voiceover and not a background bed** — that is
what separates this from every other format. The song is made by
`tools/song.mjs` (ACE-Step, local, free); the visuals are any cartoon look
(flat 2D, Pixar-3D, paper, low-poly — pick one and lock it). Read
`references/song-maker.md` and `references/production-discipline.md` first.

**Engine stack:** lyrics (from the approved script, in the song's structure) →
**`tools/song.mjs`** for the song → cartoon character/scene stills in an image
model → Kling / Google Omni / Seedance image-to-video for the animated shots
(cut to the beat, mostly performance/action, little or no lip-sync) → assembly +
lyric captions in the editor (`tools/assemble.mjs`), the song as the full audio
track.

---

## Legal / originality guardrail
Two guardrails, because this format generates both a song and a cartoon:
- **The song is original.** Never imitate a specific copyrighted song, artist,
  melody, or a recognizable hook. Describe a *genre/energy* in the caption, not
  "sounds like [artist]". The generated track is yours to use (clears
  `references/edit-assembly.md` §9).
- **The cartoon is original.** Use an *aesthetic* (flat 2D, Pixar-ish 3D, paper,
  etc.), never a named show's characters, logos, or exact designs. Every
  character is generic and original. If the user asks for a named IP, decline and
  offer an original character in the same style.

---

## When this format fits the DNA
A simple, emotional benefit that survives being sung (not a spec-heavy technical
pitch) · a memorable brand name or a short offer that works as a hook line ·
comedy/charm tolerance · a young, social, top-of-funnel audience · a mechanism
that compresses to one line. Awareness-wise it is strongest at
**Problem-aware / Product-aware**, run as brand-recall + CTA rather than a
detailed argument.

Two sub-modes:
- **Mascot/character mode** (default). One original cartoon character (or a small
  cast) sings/acts the song, dancing through simple scenes tied to the lyrics.
- **Lyric-montage mode.** No lead character; the visuals are a fast montage of
  cartoon scenes illustrating each line, with the words on screen. Simpler to
  produce (little lip-sync).

---

## Production rules

1. **The song structure IS the ad structure.** Map the competitor's beat order
   onto song sections: **intro = the hook**, **verse(s) = problem → mechanism /
   benefit**, **chorus = the promise + brand + CTA (repeat it)**, optional
   **bridge = proof/objection**, **outro = CTA button**. The persuasion DNA lives
   in the lyric order, exactly like a script.
2. **CTA and brand go in the chorus.** The chorus repeats, so that is where the
   offer, the brand name, and "where to get it" belong. The single most important
   line is the one you want stuck in their head.
3. **Lyrics short and singable.** Short lines, strong end-rhymes, one idea per
   line. A whole verse is 4–6 lines. This is a jingle, not a rap sheet — obey the
   copy blacklist (no AI filler, no em-dashes, no "imagine if").
4. **One cartoon look, locked.** Pick a single style (flat 2D cel / Pixar-3D /
   paper cut-out / low-poly) and lock it across every still: outline weight or
   render style, palette as hex, character model sheet. Borrow the matching
   format module's lock discipline (`simpsons-flat-2d.md`,
   `pixar-3d-character.md`, `paper-collage.md`, `low-poly-ps1.md`).
5. **Character lock (mascot mode).** Generate a model sheet + a small expression/
   pose set as anchor stills; every later still opens with a CHARACTER LOCK
   naming palette, outline, wardrobe, proportions, and loads the sheet as a
   reference. Same rule as the cartoon format modules.
6. **Cut to the beat, not to the words.** This is a music video — shots change on
   the beat / bar, faster in the chorus, slower in the verse. Motion is
   performance and action (dancing, walking, props reacting), **not** talking
   heads. Aim for a cut roughly every 1–2s in the chorus.
7. **Lip-sync is optional and light.** You do not need frame-accurate sung
   lip-sync. Prefer mouth-moving-to-the-beat, cutaways on the sung line, or
   lyric-montage mode with no lip-sync at all. Do not fight a video model for
   perfect singing mouths — cut away instead.
8. **On-screen lyrics (karaoke).** The chorus/hook lyrics can be burned as big
   animated word cards (the earworm reinforcement). Use the house caption spec
   via `tools/assemble.mjs` (karaoke highlight), or per-line hero text for the
   hook and CTA. Keep it to the key lines, not every word of every verse.
9. **Clip length:** 3–6s per animated shot, 9:16. One action per clip
   (production-discipline). Build more short shots for the chorus.
10. **Product:** the real product rebuilt as a cartoon prop with its silhouette
    and colour blocking locked; brand name/logo held out of generation and
    composited in post unless a product image was uploaded to lock it.
11. **Length:** the whole ad is one song section set or the full short song —
    typically **20–45s**. Match the song `duration` to the number of shots you
    are cutting.

## Negative constraints (visuals)

```
no photorealism, no realistic lighting or lens blur, no copyrighted or
trademarked character likeness, no named show characters, no rendered brand logos
in-frame (composite in post), no full-sentence subtitles baked into the
generation (lyric cards are added in the edit), no style drift between shots
(one locked cartoon look only), no talking-head static shots (this is a music
video — keep it moving), no extra characters entering a locked single-character
shot
```
Add the chosen look's own negative list from its format module (e.g. the flat-2D
negatives from `simpsons-flat-2d.md`).

## Paste-ready skeletons

### 1. The song — `tools/song.mjs` jobs file (`05-assets/song/song.json`)

```json
{
  "outDir": "./05-assets/song",
  "audioFormat": "mp3",
  "jobs": [
    {
      "name": "[slug]-anthem",
      "caption": "[genre], [vocal type], [key instruments], [energy], big singalong chorus, handclaps",
      "lyrics": "[Intro]\n[the HOOK line]\n[Verse]\n[problem line]\n[mechanism / benefit line]\n[Chorus]\n[the promise]\n[BRAND] — [the offer]\n[where to get it / CTA]\n[Verse]\n[proof or second benefit]\n[Chorus]\n[the promise]\n[BRAND] — [the offer]\n[the CTA]\n[Outro]\n[BRAND] [CTA button]",
      "instrumental": false,
      "duration": 35,
      "vocalLanguage": "en",
      "seed": 7
    }
  ]
}
```
Run `node tools/song.mjs 05-assets/song/song.json`. Re-roll with a different
`seed` if the melody/energy is off; adjust the `caption`, not the lyrics, to
change the *sound*. Keep the lyrics the approved persuasion beats.

### 2. Image — cartoon character model sheet (anchor, NEW)
Use the model-sheet skeleton from the chosen look's module (e.g.
`simpsons-flat-2d.md` for flat 2D, `pixar-3d-character.md` for 3D). Lock palette,
outline/render, wardrobe, one signature detail. Plain background, 9:16.

### 3. Video — music-video shot (Kling / Omni / Seedance image-to-video)

```
Realistic 9:16 [chosen cartoon style] music-video shot. Animate the referred
character image: [ONE performance action tied to this lyric beat — dancing in
place with a big grin / strutting past [simple scene prop] / throwing hands up on
the beat]. Energetic, bouncy, on-beat motion; the character faces camera. Keep
the locked look: [outline/render, flat/locked palette] unchanged, [style motion
rule — e.g. limited animation on twos for 2D]. Bright, fun, high-energy.
Native audio OFF / not needed (the song is added in the edit). No spoken
dialogue. No baked-in text or logos.
Negative: [chosen look's negative list] + no talking-head static shot, no style
drift, no realistic rendering, no camera drift off the character.
```
Generate several short shots (more for the chorus). For lyric-montage mode, make
one simple cartoon scene still per line and animate a small push/parallax instead
of a character performance.

### 4. Lyrics/script block (goes in `04-prompts/cartoon-music-video.md`)

```
SONG (structure = the ad beats):
[Intro / HOOK]:   "[hook line]"
[Verse 1]:        "[problem]" / "[mechanism or benefit]"
[Chorus]:         "[promise]" / "[BRAND] — [offer]" / "[CTA]"
[Verse 2]:        "[proof / second benefit]"
[Chorus]:         (repeat)
[Outro]:          "[BRAND] [CTA button]"

VISUALS: [look] · [mascot or montage] · shot list, one line per beat, cut on the beat.
CAPTIONS: karaoke on the chorus + hero cards on the HOOK and CTA lines.
```

## Assembly notes
Generate the **song first** with `tools/song.mjs` (approve the track before
building visuals — a re-roll is cheap and everything cuts to it). Then the
character model sheet and the per-beat stills, then the animated shots in
song order. In the assembly pass (`tools/assemble.mjs`, run by the skill):
- the **generated song is the full audio track** (`music` = the song file,
  `musicVolume` **1.0** — it is the ad's audio, not a bed under a voice; this is
  the one format that overrides the §8 low-gain bed rule);
- `captions: false` for the raw model captions, then add **lyric cards** —
  karaoke highlight on the chorus, hero `text`/`overlays` for the HOOK and CTA;
- hard cuts in song order, faster in the chorus; the brand CTA end card over the
  outro; `"disclosure": false`; export 1080×1920.

Cut the shots to the beat: line them up so a cut lands on the downbeat of each
new lyric line. The persuasion DNA is carried by the **lyric order** — keep the
competitor ad's beat sequence mapped onto intro → verse → chorus.
