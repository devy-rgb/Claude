# Format Module — Official Desk Authority

A single speaker seated behind a desk in what reads as a government or civic
office — US flags flanking them, a dark wood desk, a monitor or binder in
the background, professional blazer. The aesthetic is a county commissioner
giving a statement, a federal program rep doing an informational clip, or a
local news-adjacent spokesperson. No one questions a person behind a flag —
the setting does the authority work before a word is said.

**Default character (override any time):** Black female, mid-30s to early
50s, full professional blazer over a white or cream top, gold chain or pendant
necklace, Apple Watch or simple watch, shoulder-length or longer wavy/relaxed
hair, warm confident smile, calm authoritative delivery. Reference the image
the user provides if one is attached; otherwise generate from this description.

**Engine stack:** Seedance 2.0 prose with a reference image (`@Image 1`),
routed to **Adsora Gen** when its keys are present (face-to-camera format;
listed in `routing.face_ugc_formats`). Alternative: Nanobanana Pro still →
Google Omni. Read `references/formats/ugc-yapper.md` for the base yapper
rules — they apply — then this file for what the desk and flags change.

---

## When this format fits the DNA

- **"US program" / benefit / government-adjacent offers** — windows, roofing,
  bath, siding, Medicare, ACA, any offer framed as a public benefit. The set
  says "this is official" before the speaker opens their mouth.
- **Announcement / reveal hooks** — "Starting this month, qualifying
  homeowners can receive…" reads as a briefing, not a pitch.
- **Credibility-gap offers** — whenever the viewer's first instinct is "this
  sounds too good to be true," the desk + flag combo shifts the register from
  ad to public notice.
- **Authority voice-overs** — the format works with the speaker addressing
  the camera directly OR as a talking-head over b-roll cutaways of the product
  or the form.

Skip it when the script needs authenticity through messiness (use in-car UGC
or raw yapper instead) or when the offer is entirely consumer/lifestyle with
no program/benefit framing.

---

## Set construction (lock every element in every clip)

| Element | Spec |
|---------|------|
| Desk | Dark wood or mahogany-toned, papers or a closed binder on it, a low monitor to one side (screen off or angled away), no glass desk |
| Flags | Two US flags on poles, one each side of the frame behind the speaker's shoulders — full flag visible, gold eagle finials, flag fabric not blowing |
| Wall | Warm neutral — cream, tan, or soft sage. A framed seal or certificate visible but not readable. Wooden shuttered blinds, half-open, warm afternoon light |
| Lighting | Soft key from the front-left, warm tungsten tone, no harsh shadows, slight fill from the right — "news anchor" quality, not studio-flat |
| Speaker framing | Medium close-up: desk surface visible at the bottom of frame, hands visible resting on the desk or clasped, head and shoulders centered, slight headroom |

---

## Production rules

1. **Flags are the set signature — they must be readable as US flags** in the
   first frame. Lock them: "two United States flags on poles, one on each side
   of frame, gold eagle finials, fabric hanging straight, clearly the US flag
   design." Put this in every clip.
2. **Character anchor once**, exactly as the yapper module: age, ethnicity,
   hair, eyes, build, blazer color, necklace, energy, one voice-line. Same
   anchor for every clip. If the user provides a reference photo, pin it as
   `@Image 1` and open every clip with "The [person] from @Image 1, seated
   behind the desk."
3. **Delivery is calm and direct, not salesy.** Think "public health
   announcement," not "infomercial." Inline the tone per clip: "even-paced,
   warm authority, the tone of someone giving important information to their
   community, no raised pitch or excitement, no sales cadence."
4. **Hands are visible and purposeful.** Clasped on the desk at rest; one hand
   lifts to make a point (index finger up, not pointing at camera); both hands
   open and turned up on the benefit reveal. One physical hand beat per clip,
   stated explicitly in the prompt.
5. **Segment at ~35–45 words / ~12–15s.** The authority register does not
   rush. Shorter segments here than UGC yapper — the pacing is slower and more
   deliberate.
6. **No prop paper or phone in hand.** Papers exist on the desk but are not
   lifted or read from. If a visual proof beat is needed, cut to a b-roll
   insert (`region: "bottom"`, 2s) — the desk speaker returns immediately.
7. **Audio is a mid-sized room.** Inline per clip: "clean condenser mic, a
   slight room tone of a carpeted office, no echo, no music, no ambient chatter,
   no keyboard sounds." Not phone-mic intimacy — this is a prepared statement.
8. **Chain clips** by passing clip N as `@Video 1` into clip N+1 with the
   yapper module's continuation opener, adding "still seated behind the desk,
   flags unchanged, same framing."
9. **No chyron or lower-third in generation.** The edit layer adds the banner.
   Keep "no lower-third text, no chyron, no title card" in every clip's
   constraints.
10. **The smile is the tell.** On the hook the speaker is composed; on the
    benefit reveal — the moment "you could qualify for free replacement" lands —
    she smiles and nods once. State this micro-expression in the clip prompt.

---

## Negative constraints (`constraints:` clause, per clip)

```
constraints: two US flags clearly visible on poles in the background, one each
side of frame, gold eagle finials, fabric hanging straight — do not lose or
obscure either flag, no flag morphing or duplication, dark wood desk surface
visible at the bottom of frame, no glass desk, no moving flag fabric, no
readable text on any papers on the desk, no chyron, no lower-third, no title
cards, no scrolling ticker, no captions, no extra people in the room, no
window showing the outside world behind the flags, no bright backlight, no
studio-flat white background, no sales energy or raised pitch in delivery,
preserve the speaker's identity and wardrobe across all clips, mouth motion
matches the spoken words, no beauty filter, no doubled audio.
```

---

## Paste-ready skeleton (Seedance 2.0 prose, ≤2000 chars)

```
━━━━━━━━━━━━━━━━━━━━━━
CLIP 1 — 13s | official desk, medium close-up | ~[N]/2000 chars
━━━━━━━━━━━━━━━━━━━━━━
The [person — default: Black woman, early 40s, shoulder-length wavy dark hair,
warm brown eyes, black professional blazer over a white top, gold pendant
necklace, Apple Watch] from @Image 1 sits behind a dark mahogany desk, hands
clasped on the surface, framed in a medium close-up. Behind her: a warm
cream-tan wall with a framed certificate (text unreadable), wooden shuttered
blinds half-open letting in warm afternoon light, and two US flags on poles
flanking her — one left, one right — gold eagle finials, fabric hanging
straight, the flag design clearly legible. A closed dark binder sits to one
side of the desk; a monitor with its screen angled away is visible at the far
edge. Soft front-left key light, warm tungsten, slight fill from the right —
news-anchor quality lighting. On the hook line her hands open slightly and she
looks directly into the lens with calm authority; on the benefit reveal she
gives a single warm nod and a composed smile before returning to direct eye
contact. Clean condenser mic, slight carpet-room tone, no echo, no music, no
ambient chatter. She says in a clear, measured American accent, even and warm,
the tone of someone delivering important community information — not a sales
pitch: "[exact lines for this segment, verbatim from 03-rebuild.md]". Vertical
9:16.
constraints: [the clause above].
```

---

## Assembly notes

- **Banner:** this format earns a bottom banner more than any other — add one
  (`banner: true`) with the program name and CTA. It reads as a chyron even
  though it is added in the edit layer.
- **Captions:** karaoke, 3 words, `y` 0.78 — below the desk line so they do
  not compete with the face.
- **Cutaways:** a 2s `region: "bottom"` insert of the eligibility screen or the
  finished product on the benefit-reveal beat. The desk speaker holds for a beat
  after the cut returns.
- **zoom:** 1.0 → 1.05 between clips only — the authority register does not
  want jumpy punch-ins.
- `disclosure`: `false` (hard rule 14 — no disclaimer line).
- End card: strong here — freeze the last frame, fade the banner to a solid
  CTA card. The format lands well with a hard cut to a plain CTA rather than
  a talking-head sign-off.

---

## Routing and cost

`official-desk-authority` is a face UGC format: **Adsora Gen** when
`RUNPOD_API_KEY` + `RUNPOD_VIDEO_ENDPOINT_ID` are present, otherwise
Evolink Seedance. 10–13s clips beat longer ones on Adsora Gen cost; the
measured delivery means fewer words per clip anyway. Plan 4–5 clips for a
60s script, 2–3 for a 30s.
