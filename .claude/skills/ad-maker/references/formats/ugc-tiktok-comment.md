# Format Module — UGC Reply-to-Comment (creator answers a comment on screen)

A yapper clip that opens with a "Reply to @user's comment" bubble pinned to the
top of the frame. The comment is the objection; the first line of the script
answers it; proof clips slide into the bottom half of the frame under the face
while the speaker keeps talking; word-highlighted captions sit on the seam. It
makes the pitch feel *requested* — someone asked, so the creator is explaining,
not selling.

**Engine stack:** the `ugc-yapper` stack for the face (Seedance 2.0 prose with
a reference pack → **Adsora Gen** when its keys exist; Nanobanana → Omni as the
alternative). The comment bubble, any stat card and the landing-page mock are
flat graphics from `tools/card.mjs`; the half-frame proof inserts and captions
are `tools/assemble.mjs` (`overlays`, `cutaways` with `region: "bottom"`).
Read `references/formats/ugc-yapper.md` first — every yapper rule applies.

---

## When this format fits the DNA

- **Objection-led DNA.** "Do I qualify?", "Is it too late?", "Does it work if
  I only…", "Isn't that a scam?". The comment states the doubt; the ad exists
  to kill it.
- **FAQ social proof** — the pitch is framed as the tenth time the creator has
  been asked, so it carries "lots of people want this".
- **Category-qualifying offers** (legal intake, benefits, refunds, insurance,
  home services quotes): the comment is the self-disqualification the DNA
  reverses ("I only used it occasionally" → "doesn't matter").
- The competitor ad *is* a reply-to-comment video. Transplant the comment
  shape and the answer shape exactly.

---

## Production rules

1. **The comment is the objection, never the pitch.** ≤ 14 words, lowercase,
   phrased the way a real viewer types ("is it too late to qualify for the
   settlement?"). The DNA's hook answers it in the first sentence of the
   script — "Stop disqualifying yourself before you even check" is a reply,
   not an opener.
2. **Invented handle, blank avatar.** `first-name + digits` or `word.word`
   (`maddie.k22`, `sidthekid127`-style). Never a real account, never a real
   person's name, never a brand handle. `card.mjs` draws a grey silhouette
   avatar on purpose.
3. **The bubble lives through the hook beat only** — on from frame 0, off at
   the end of the sentence that answers it (5–8s). Top third of the frame,
   ~85% of the width, `x` ≈ 5% in. After that the top of the frame is free
   for a `banner` if the DNA has one.
4. **The speaker is cast to the objection.** The person on screen is who the
   commenter would believe: the same demographic as the avatar, in a warm,
   ordinary setting (a garden table at golden hour, a kitchen, a porch), with
   one lived-in tell (a mug, a dog asleep in the background). Tripod-static or
   propped, chest-up, a little wider than a selfie so the bottom half can be
   given away to proof.
5. **Proof goes in the bottom half, the face stays in the top half.** Under
   each proof line, a `cutaways` entry with `region: "bottom"` for 1.5–3s:
   the product (a still or clip), a stat card (`card.mjs` `headline` on a
   dark box, e.g. "$8.9 BILLION / 60,000+ CLAIMS"), a news-desk style graphic
   (a still), a document. The speaker never stops. Face-only for the emotional
   lines; proof under the factual ones.
6. **The last beat is the destination.** A landing-page mock (a `card.mjs`
   `html` card or a supplied screenshot, shown as a still with `zoom` 1.0 for
   2–3s) while the CTA line plays, optionally `region: "bottom"` under the
   face rather than full-frame so the speaker says "tap below" over it.
7. **Captions on the seam.** Karaoke, 2–3 words, uppercase, `y` 0.55 — just
   above the split so they read as part of the top half. One highlight
   colour; the reference ads alternate two, which reads the same at speed.
8. **Segment the script at ~40 words / 15s** as the yapper does, chained via
   `@Video 1`; the bottom-half inserts hide most pose snaps at the cuts.
9. **No disclaimer** (hard rule 14). `"disclosure": false`; no dramatization
   line and no category legal `text` on any body clip, even though the format
   imitates organic content. Only the user's own request in that run changes
   this, using their wording.
10. **Never generate the UI.** The bubble, the captions, the stat card and
    the landing page are all composited; the clip prompt bans on-screen text,
    UI and overlays like every yapper clip.

## Negative constraints (`constraints:` clause, per clip — the yapper clause plus)

```
no comment bubble, no social-media UI, no floating text, no digital overlay
of any kind, the bottom third of the frame stays clear of props and hands,
no readable text on anything in the scene, no second person, no phone
visible, camera fixed, no music.
```

## Paste-ready skeletons

### Cards (`05-assets/cards/cards.json` → `node tools/card.mjs`)

```jsonc
{ "outDir": "./ad-remix-runs/<slug>/05-assets/cards", "scale": 1,
  "cards": [
    { "name": "reply", "kind": "comment", "username": "maddie.k22", "width": 900, "size": 40,
      "text": "is it too late to qualify for the settlement?" },
    { "name": "stat",  "kind": "headline", "width": 1000, "size": 64, "box": "#101820",
      "text": "$8.9 BILLION\n60,000+ CLAIMS FILED" },
    { "name": "page",  "kind": "html", "width": 1080,
      "html": "<div style=\"background:#fff;padding:60px 48px;font-family:-apple-system,'Helvetica Neue',Arial;color:#111\"><div style=\"font-size:22px;color:#c2185b;font-weight:700;letter-spacing:.08em\">FIND OUT IF YOU QUALIFY</div><div style=\"font-size:46px;font-weight:800;line-height:1.1;margin:18px 0 28px\">[Headline of the real landing page]</div><div style=\"font-size:26px;line-height:1.45;color:#333\">[first qualifying question]<br><br>☐ Yes &nbsp; ☐ No</div></div>" }
  ] }
```

### Clip block (Seedance 2.0 prose — the yapper skeleton with the framing changed)

*"…filmed from a phone propped on the table so the frame holds her from the
chest up in the upper half, the lower half of the frame open table and lawn
with nothing in it…"* — the rest is the yapper skeleton, verbatim script,
`constraints:` from the pool above.

### Assembly (`06-finals/ugc-tiktok-comment/assemble.json`)

```jsonc
{
  "outDir": "./ad-remix-runs/<slug>/06-finals/ugc-tiktok-comment",
  "aspect": "9:16", "size": "1080x1920", "font": "Arial Black",
  "captions": { "style": "karaoke", "wordsPerCue": 3, "y": 0.55, "highlight": "#FFE600" },
  "disclosure": false,
  "jobs": [{
    "name": "ugc-tiktok-comment-final",
    "clips": [
      { "file": "05-assets/ugc-tiktok-comment/clip-1.mp4", "script": "[hook + first objection answer, verbatim]",
        "overlays": [{ "file": "05-assets/cards/reply.png", "x": 60, "y": 150, "w": 900, "from": 0, "to": 6.5 }],
        "cutaways": [{ "file": "05-assets/ugc-tiktok-comment/product.png", "at": 7.0, "seconds": 2.5, "region": "bottom" }] },
      { "file": "05-assets/ugc-tiktok-comment/clip-2.mp4", "script": "[mechanism / doubt-kill, verbatim]", "zoom": 1.08,
        "cutaways": [{ "file": "05-assets/cards/stat.png", "at": 2.0, "seconds": 2.5, "region": "bottom" },
                     { "file": "[b-roll clip]", "at": 6.0, "seconds": 2.2, "region": "bottom" }] },
      { "file": "05-assets/ugc-tiktok-comment/clip-3.mp4", "script": "[CTA, verbatim]",
        "cutaways": [{ "file": "05-assets/cards/page.png", "at": 0.8, "seconds": 3.0, "region": "bottom" }] }
    ]
  }]
}
```

## Assembly note

Cards first (`node tools/card.mjs 05-assets/cards/cards.json`), then
`--plan`, then render. QA from `manifest.json` (`heard` per clip) and a 1-fps
frame review: the bubble must not cover the eyes (raise `y` on the overlay or
re-frame the still), the bottom inserts must not cover the mouth (the clip
was framed too low — re-roll from a higher-framed still), captions must sit
above the seam. Hook tests swap the comment card and clip 1 only.
