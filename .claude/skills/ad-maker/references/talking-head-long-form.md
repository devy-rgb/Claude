# Talking faces on Adsora Gen — the house recipe

**Short = t2v. Long = chained i2v with H3's own audio. Avatar mode only when the
exact voice track must survive.** This is the procedure that produced clean,
lip-synced 47-second presenter reads on 2026-09-05, and the reason the earlier
attempt looked bad. Read it before building any talking-head, UGC yapper, or other
face-to-camera format on Adsora Gen.

---

## 0. Why this exists — the lip-sync trap

MiniMax H3 has three graphs. Two of them make the **voice and the picture in the
same pass** (`t2v`, `i2v`), so the lips are natively locked to the sound. The
third, `avatar` (s2v), takes a voice track you supply — and it does **not** play
that track back. It **re-synthesizes** it internally (measured envelope
correlation ≈ 0.48 with the reference), animates the lips to *its* version, and
then `adsoragen.mjs` muxes your original WAV back over the picture so the chosen
voice is preserved. Result: lips made for audio A, playing audio B. The drift is
small per second and grows with clip length, so a 5s avatar clip passes and a 14s
one reads as bad dubbing.

It is **not** the stitching. Concatenating clips is a lossless stream copy; four
separate clips that each look perfect will still look perfect joined. When a long
video looks worse than its parts, it is the generation *mode* that changed.

---

## 1. Which mode

| You need | Mode | Why |
|---|---|---|
| A face saying one line — ≤ ~35 words, ≤ 15 s | **`t2v`** (or `i2v` from a portrait when the look must match an existing clip) | picture + voice in one pass; native sync; accent is prompt-directed and holds |
| The **same** face reading a whole script — anything over 15 s | **chained `i2v`, native audio** (§2) | the face is locked by start-frame chaining; every clip has native sync |
| The **exact** voice track must survive — a cloned voice, a client's own VO | `avatar` (s2v), clips ≤ ~8 s, accept softer sync | the only mode that lip-syncs to supplied audio; sync degrades with length |

Accent on `t2v` / `i2v` is a prompt line ("speaking with a strong Florida Southern
American accent") and it holds — H3 makes the voice. Hard rule 17 still applies:
American by default, another vernacular only when the run names it.

---

## 2. Long-form procedure (the exact steps)

**Prereq:** `node tools/adsoragen.mjs --health` → `LIVE`.

1. **Establish the look.** One 15 s `t2v` clip of the presenter: scene + presenter
   description + accent + a short line from the script. (An existing on-brief clip
   works too.) Write the prompt so the presenter *ends* settled: "…then pauses with
   a calm closed-lip smile, mouth still."
2. **Cut the portrait from the END of that clip, never mid-word.** After the last
   word the mouth closes; that settled, closed-lip, eyes-to-lens frame is the
   reference. Grab it ~0.2 s before the end (`ffmpeg -sseof -0.2 -i clip.mp4
   -frames:v 1 portrait.png`), then **verify** with a dense contact sheet of the
   last ~0.9 s (`-vf "fps=10,scale=192:-1,tile=5x2"`) and pick a lips-closed frame.
   A frame taken at a random second is almost always mid-syllable and muddies
   articulation for every clip that follows.
3. **Chunk the script on sentence boundaries**, ≤ ~29 words per chunk (≈ 13 s at
   H3's pace; the hard cap is 15.08 s). Four chunks cover ~100 words / ~47 s.
4. **Seconds per chunk = 0.4 × words + 1.5**, capped at 15. The slack is what
   lets the mouth close before the cut, so the last frame is a clean seed.
5. **Prompt per chunk:** scene + presenter + accent + one beat direction +
   `They say: "<chunk>"` + `Then they pause with a calm closed-lip smile, mouth
   still.` + the locked-off / no-on-screen-text clauses. Repeat the accent line on
   **every** chunk — each clip is its own take.
6. **Chain by start frame.** Clip 1 = `i2v` from the portrait. Clip N+1 = `i2v`
   from clip N's **last settled frame** (`-sseof -0.3`). **One seed for every
   clip** — a fresh seed re-rolls the look at each join.
7. **Concat** with the concat demuxer, `-c copy` (same codec, size, fps); fall
   back to a re-encode only if copy refuses.
8. **QA the joins** before sending: a sheet of clip N's last frame beside clip
   N+1's first (`tile=2x3` for 4 clips). Pose, framing, desk, props must match; a
   soft expression shift (closed lips → the smile as the next line starts) is
   fine; a pose-snap is not — bridge it with a b-roll cutaway (house rule).
9. **Deliver per the per-video rule:** first presenter → send → wait for the go →
   the rest in parallel. Three chains ran concurrently on the 6-worker pool with
   no contention.

`tools/talking-head-chain.sh` does steps 4–8 end to end from a chunks file (§4).

---

## 3. Measured (2026-09-05, 480p, seed shared, steps 16)

| clip | length | exec | real cost |
|---|---|---|---|
| clip 1 (cold start) | 13.7 s | ~220 s | ~$0.21 |
| clips 2–4 (warm) | 10–11.5 s | ~100–125 s | ~$0.10–0.12 each |
| **one presenter, 4 clips** | **46.9 s** | **~10–12 min** | **~$0.55** |
| four presenters | 4 × 46.9 s | 3 chains concurrent | **~$2.18** |

The tool's own estimate runs ~2.5× high; the real number is written to
`<jobs>.results.json`. For comparison the superseded avatar+mux chain cost about
the same ($0.60) and was unusable.

**Voice note:** H3 voices each clip fresh, so timbre can shift a touch at a join.
If a join *sounds* different, re-roll that one clip on the same seed, or cover the
cut with b-roll. Do not "fix" it by switching to avatar mode.

---

### Measured 2026-09-12 — the clip length sets the speaking rate

H3 fills the clip it is given. The default formula (0.4 × words + 1.5 s) reads at
about 2.0 words/sec; `--spw 0.3 --slack 1.0` plus a `--pace` line ("talking fast, a quick
brisk sales-pitch pace with no pauses between sentences, every word still clearly
enunciated") reads at 3.0 words/sec with every word intact — probed on one chunk both
ways, then 21/21 chain clips complete. A 165-word script is ~60 s instead of ~80 s.
Probe before going lower; words drop once the clip is shorter than the read. Also
measured the same day: a closed-lip Nanobanana still seeds the chain directly (three
chains, no establishing clip, no drift at the joins).

## 4. The tool

```
zsh tools/talking-head-chain.sh \
  --portrait portrait.png \
  --who   "A white woman in her late 40s in a navy blazer" \
  --scene "sits at a tidy office desk, a state flag on a pole behind them, warm window light" \
  --chunks chunks.txt \            # one chunk per line, sentence-bounded, ≤ ~29 words
  --out   ~/Downloads/final.mp4 \
  [--accent "strong Florida Southern American accent"]   # default: neutral American
  [--beats beats.txt]             # optional, one beat direction per line
  [--seed 238637134] [--quality 480p] [--workdir <dir>]
```

It writes one `i2v-N.jobs.json` per chunk, runs `adsoragen.mjs` for each, seeds
each next clip from the previous settled frame, concatenates with `-c copy`, and
leaves `joins-sheet.png` in the workdir for the QA step. Portrait extraction (§2
step 2) is deliberately manual — look at the sheet and choose.

---

## 5. Do not

- Use `avatar` for a long read because "it keeps the voice." It keeps the voice and
  loses the lips.
- Take the portrait from a random timestamp. Mid-word frames poison every clip.
- Let each clip pick its own seed.
- Supply a voice track when native audio is what you want (`i2v` refuses one
  anyway).
- Re-encode at concat when copy works — pure generation loss.
- Send without the joins sheet.
