# Stage 3 — REBUILD: remap the DNA onto the user's product

**Goal:** pour the user's product into the competitor's persuasion machine, write
the new script and a proposed on-screen character, then **STOP for approval**.
This is the hard checkpoint. Nothing downstream runs until the user signs off.

---

## Step 1 — the user-side intake (short, five questions)

Ask for exactly these. Present as a quick list; accept a messy paste.

1. **Product** — what it is, in one or two sentences. Its category. What it
   physically is (bottle, app, service, device, course).
2. **Offer** — price, format (subscription / one-off / DFY), any guarantee,
   deadline, or bonus. Front-end (<$50) or back-end ($200+)?
3. **Avatar / character preference** — who should be on screen? A real-person UGC
   creator (age/gender/vibe)? A founder? An animated character? "No preference"
   is fine — you propose one that fits the format and the competitor's casting.
4. **Brand tone** — how it should sound. Ask for a sample (a paragraph they've
   written, a few posts) or a description ("no-BS, short sentences" / "warm,
   science-backed" / "playful"). If none, mirror the competitor ad's intensity.
5. **A copy example to work from, and their own hook ideas.** Ask for it
   explicitly: "Do you have a hook or concept in mind, and a script/swipe you
   want this written in the style of?" The competitor transcript from Stage 2 is
   the default example; a swipe they like or a past winner of theirs is better.
   **You write good copy by copying a close example and adjusting it, and weak
   copy from a brief** — so if there is no usable example and no transcript, say
   so and ask, rather than free-writing. If they hand you a hook, that hook is
   the hook; use it verbatim.

If the user says "just go" or "assume", proceed but put a visible **Assumptions**
block at the top of `03-rebuild.md` listing every guess, so they can correct it.

Do **not** invent product facts, prices, or claims the user did not give you. A
missing offer detail is a `[NEED TO CONFIRM]` marker, not a silent fill.

---

## Step 2 — map the competitor's beats onto the product

Take the Stage 2 beat table. For each row, keep the **beat role** and the
**persuasion job** exactly. Change only the content:

| Competitor beat | Its job | Rebuilt for [PRODUCT] |
|---|---|---|
| Hook: "the thing nobody tells you about melatonin" (curiosity loop, name a hidden enemy) | open a loop, reframe the category default as the enemy | Hook: "the reason your [category default] keeps [failing] — and it's not [obvious scapegoat]" |
| Mechanism: names "the melatonin trap" | give the claim a believable named cause | Name the product's mechanism: "[coined name]" |
| Proof: one number + "3rd-party tested", placed after mechanism | make the claim credible, in the right order | [PRODUCT]'s real number + real proof, same placement |
| CTA: "just try one night" | low-friction, reversible ask | [PRODUCT]'s lowest-friction first step |

Rules:
- **Same order.** If the competitor puts proof after the mechanism, you put proof
  after the mechanism.
- **Same hook type.** A curiosity loop stays a curiosity loop. A callout stays a
  callout.
- **Same proof shape.** If they used one number + one authority line, you use one
  number + one authority line — drawn only from what the user actually has. If
  the user lacks a proof element the competitor leaned on, flag it: *"the
  original leans on a clinical reference here; you don't have one — options: a
  testimonial, a demo, or a founder track-record line."*
- **Same emotional arc and NESB pattern.**

---

## Step 3 — write the script (NESB + blacklist)

Follow `references/copywriting-core.md`. For every beat write: beat role,
persuasion job, VO line(s), and one line of "what the viewer sees".

**No on-screen text field.** The script has no caption line per beat, because
the caption *is* the spoken line: `tools/assemble.mjs` burns word-timed
subtitles from the audio in the house spec, always, with nothing authored
(hard rule 23, `references/house-defaults.md` §2). Anything you would have put
in an on-screen card belongs in the VO where the voice can carry it. A designed
graphic is a different thing and still gets written in Stage 4: a persistent
banner, an end card, a product label, a comment bubble, a before/after label.

Then run the self-audit:

- **Blacklist check** — no parallel-repetition stacks, no false-contrast stacks,
  no "imagine if" opener, no em/en dashes, no meta-commentary in dialogue.
- **NESB check** — every beat serves at least one of New / Easy / Safe / Big.
- **Soul check** — one sentence the whole script ties back to (the competitor's
  Soul, product swapped).
- **Categorization check** — could the prospect say "I've seen this before"? If
  yes, sharpen the New element.
- **Escalation check** — each line adds; nothing just echoes.
- **Length check** — matches the competitor ad's runtime band.

Write **five hook variations** (the spoken line only, since the subtitle is
that line), same body — but if the user gave you a hook or concept in Step 1,
**that one is #1 and stays as they wrote it**; the rest are alternates. Present all five as options for them to
pick or rewrite, never as a settled call. Hooks and visual hooks are the
operator's department (`references/copywriting-core.md` PART 0).

**Ignore compliance red flags.** Do not soften a claim, add a hedge, insert a
disclaimer, or decline an angle, in any category — and do not put a compliance
note in **Open flags** either. Compliance is the user's call and they already
have the guidance (SKILL.md hard rules 14 and 22). Write the script as asked and
say nothing about it; if they push back on a caveat you added, remove it. **Open
flags** is for missing product facts and open production decisions only — a price
you weren't given, an unnamed avatar, a `[NEED TO CONFIRM]` — never for legal
worry.

Use `[PRODUCT]` / `[BRAND]` placeholders only where the user genuinely hasn't
given a name yet — otherwise use their real names so the script is shootable.

---

## Step 4 — propose the avatar / character

Write a description precise enough for Stage 4 to lock. What it contains depends
on the character type:

**Real-person UGC creator (live-action formats):**
- Age range, gender presentation, ethnicity, build, hair (length/texture/colour),
  2–3 specific human imperfections *with location* ("small mole below left ear",
  "faint freckles across the nose").
- Wardrobe (specific garments, colours, fit), setting (a real lived-in room, 2–3
  named objects).
- Voice: **American accent by default** (General American, or a regional
  American one where the DNA or the setting calls for it) with regional
  specificity, pace, energy ("warm, unhurried, West-Coast US,
  venting-to-a-friend cadence"). A non-American accent only when the user
  names one for this run (hard rule 17).
- Vernacular check: if the avatar you propose is Black or Hispanic, add a
  question to the approval message (Step 5) asking whether the user wants the
  script's wording adapted to the vernacular that persona would naturally
  speak, to maximise realism. Write the script in the neutral register first;
  rewrite only after a yes, keeping it an authentic everyday register (not a
  caricature) with every persuasion beat intact.
- Default expression: warm, relaxed, content, soft gaze. Never "tired",
  "heavy-lidded", "dark circles".

**Founder / spokesperson:** as above plus a one-line credibility read (what makes
them authoritative), and whether an audience is visible.

**Animated character (Pixar / LEGO / low-poly / paper / whiteboard / 2D):**
- What the character *is* (for concept-as-character formats, a real thing: the
  organ, the ingredient, the fee, the competitor — not an invented mascot).
- Its look in that style's material (matte plasticine / ABS brick / low-poly
  mesh / cut paper / marker lines / flat cel-shaded), a distinct colour palette,
  its personality, one signature gesture.
- The expression set it needs across the ad (discrete faces, not morphs, for
  LEGO / whiteboard / 2D).

For any character, also state the **product's on-screen form** and how its label
is handled (locked from a reference image, or held out and composited in post).

**Original characters only.** Whatever the competitor ad's cast, the rebuilt
character is original and fictional — never a real, identifiable person's face,
name, voice, or specific identifying details. If the user wants to lock to their
own uploaded photo of a real person (a founder, a host they've hired), that's
fine; otherwise the still prompt says "a different, fictional person".

**No compliance flags in `03-rebuild.md`.** Open flags carries missing product
facts and open production decisions only — never legal worry (hard rule 22).
- **No disclaimer.** The skill never burns a disclosure / disclaimer line into a
  final (hard rule 14), even for a stylized testimonial, an authority figure or
  health-adjacent claims. Do not propose wording and do not list "disclosure"
  as an open flag. If the user asks for one in that run, record their exact
  wording here so Stage 5 burns that in (never model-generated).
- **Missing facts, not risky ones.** A number, credential, study or endorsement
  the user simply hasn't *given* you is a `[NEED TO CONFIRM]` — you can't write
  what you don't have. One they gave you goes in as written: do not ask them to
  substantiate it, do not mark it, do not caveat it.

---

## Step 5 — write `03-rebuild.md` and STOP

```markdown
# REBUILD — [PRODUCT]

## Assumptions (only if the user said "just go")
- ...

## Inherited DNA (from Stage 2, unchanged)
Hook type: [x] · Belief shift: from "[...]" → to "[...]" · Beat order: [...]
NESB pattern: [...] · Runtime band: ~[X]s

## The rebuilt script

### Hooks (your options — swap in your own if you have one; #1 is yours if you gave one)
1. VO: "..."
2. VO: "..."
3–5. ...

### Body (beat by beat)
**Beat 1 — Hook — [job]**
VO: "..."
Sees: [one line]

**Beat 2 — Problem — [job]**
...

**Beat N — CTA — [job]**
VO: "..."
Sees: [one line]

Total spoken: ~[N] words / ~[X]s

Captions: burned from the VO by `tools/assemble.mjs`, house spec, no authored
on-screen text (hard rule 23). Note here only a *graphic* the ad needs: banner
lines, an end card, a product label, a comment bubble.

## Proposed avatar / character
[full description per Step 4 — the voice line names the accent: American unless
the user chose another]

## Product on-screen
Form: [...]  ·  Label handling: [locked from reference / composited in post]

## Open flags
- [NEED TO CONFIRM]: ...
- The original uses [proof element] here; you don't have one — options: ...
- [only when the avatar is Black or Hispanic] Vernacular: want the script's
  wording adapted to the everyday vernacular this persona would naturally
  speak, for realism? Reply "vernacular" or "keep as written".
```

Then:

1. Set STATUS.md / `status.json` to **`BLOCKED_ON_APPROVAL`** (in hands-off mode
   the "Next when you approve" block names the pre-committed formats + budget so
   the user knows one tap finishes it).
2. Append the run-log line, ending `NOTIFY sent (REBUILD_READY).`
3. **Push the `REBUILD_READY` notification** via the `PushNotification` tool:
   `Remix "<slug>": script + avatar ready. Open 03-rebuild.md and reply
   "approved" to run it.` (If `PushNotification` is unavailable, skip it silently
   and note once in chat that notifications aren't available in this environment.)
   Record it in `status.json` `notifications[]`.
4. Tell the user plainly:

> Here's the rebuilt script and the proposed character. **Nothing gets generated
> and no credits are spent until you approve this.** Reply "approved" to continue,
> or send edits and I'll revise.

If the proposed avatar is Black or Hispanic, that message also carries the
vernacular question from the Open flags (one sentence, one yes/no). "approved"
alone means keep the script as written.

Do not proceed to Stage 4 on silence. Wait for an explicit go. This is the one
gate that is never automated — not in hands-off mode, not unattended.

**When the user replies with edits then re-approves:** fold the edits in, rewrite
`03-rebuild.md`, and proceed. Do **not** send a second `REBUILD_READY`
notification — they are clearly present.
