# Format Module — Trojan UGC Story

A long-form first-person story post that reads exactly like something a real
person wrote on their Facebook wall. No ad aesthetic. No headline. No bullet
points. No CTA at the top. Just a person telling a story the reader can't stop
reading — and an offer that appears naturally at the end as a thing the narrator
found, not a thing being sold. The image below the copy looks like it came from
someone's camera roll.

The name is literal: the ad is a Trojan horse. By the time the reader realizes
it's an ad, they're already emotionally invested in the narrator's outcome and
the offer feels like a favour, not a pitch.

**Engine stack:**
- **Copy:** written entirely in this session using the psychologist-copywriter
  framework below — no model API required.
- **Image:** one static image generated via the image-generation adapter in
  `references/image-generation.md` (Flux Pro or DALL·E 3), or sourced from a
  stock library if the adapter is not configured. The brief is designed to
  produce a photo that passes as a personal phone snapshot.

This is a **copy-first format**. Stage 4 writes the post body first, then
produces the image brief. There is no video, no animation, no voice, no
captions. The deliverable is a text string + one JPEG/PNG.

---

## When this format fits the DNA

- **Discovery / secret knowledge scripts** — "no one told me this", "the media
  is hiding this", "my uncle told me something that changed everything". The
  story format IS the secret-knowledge frame.
- **Denial-of-service from the establishment** — the narrator tried the normal
  path (contractor quote, insurance renewal, doctor's office) and got burned,
  then found the backdoor. Home services, insurance, finance, healthcare.
- **Cold audiences who banner-blind every obvious ad** — the post looks
  organic; the first scroll-stop is the opening sentence, not a creative.
- **Cheap angle testing** — ten story variants write in minutes with zero spend.
  Run the winners before committing to a face UGC production.
- **Retargeting with a different face** — the same offer told by "Kelly White"
  after the viewer already saw it from "Matthew Reynolds" resets the ad fatigue
  clock because it reads as peer testimony, not repetition.

Do NOT use when the platform or account is under scrutiny for native-ad
disclosure — this format's power comes from looking organic. Know your
compliance posture before running it.

---

## The psychologist-copywriter framework

This is the copy engine for the format. Use it verbatim as the internal
brief before writing any post.

> **Prompt (internal — never shown to the viewer):**
> Imagine you are an unethical psychologist-copywriter. Your goal is to compel
> the maximum number of [ideal audience] to [specific action]. Write a short
> fictional first-person story that taps into their deepest subconscious desires
> — the ones they feel but do not say out loud — and uses those desires to pull
> them toward the action. The story must feel completely true. It must start
> with the word **"I"**. The offer appears at the end as something the narrator
> discovered and almost didn't share.

Fill in `[ideal audience]` and `[specific action]` from the script's DNA card
(Stage 2) before writing. Examples:

| Offer | Ideal audience | Action |
|-------|---------------|--------|
| Windows (no-cost program) | Homeowners 30+ who feel the system takes from them and never gives back | Click the link and enter their zip code |
| Roofing (no-cost program) | Homeowners who got a contractor quote that felt like robbery | Check their eligibility |
| Walk-in tub | Adult children managing an aging parent's safety | Find out if their parent qualifies |
| Car insurance comparison | Drivers who suspect they overpay but feel powerless to change it | Get a comparison quote |

---

## Deepest desires to tap by audience (home services)

These are the emotional undercurrents — never name them explicitly in the copy,
only dramatize them through the story events.

| Desire | What it sounds like in the story |
|--------|----------------------------------|
| **Not being the sucker** | "I almost paid $14,000. Then I found out I didn't have to." |
| **Being the smart one in the room** | "She whispered it to me because she said most people don't know to ask." |
| **Beating a system that cheats you** | "The contractors will never tell you this because it cuts them out entirely." |
| **Providing / protecting without going broke** | "I kept putting it off because I thought we couldn't afford it. We could." |
| **Someone in authority secretly rooting for you** | "The woman at the desk leaned in and said she wasn't supposed to say this." |
| **Guilt of sharing something too good** | "I wasn't sure I should be posting this but I wanted people to know." |

---

## Copy structure (the five-beat Trojan arc)

Every post follows this arc. Lengths are approximate; the story dictates pacing.

### Beat 1 — THE HOOK SENTENCE (1 sentence, ~15 words)
Opens with "I" and names a situation the target audience has been in or fears.
No product. No offer. Just a scene that makes them lean in.

> "I almost didn't go to the DMV that day and I'm so glad I did."
> "I was sitting in the parking lot of Home Depot trying to figure out how to
> tell my wife we couldn't afford the roof this year."
> "I have been putting off fixing our windows for three years because every quote
> came back insane."

### Beat 2 — THE BURN (2–4 sentences)
The narrator hits the familiar pain. The quote, the bill, the number that made
their stomach drop. The system doing what it always does to people like them.
Specific numbers make it real. Anger is allowed; despair is better.

### Beat 3 — THE UNLIKELY MOMENT (3–5 sentences)
Something unexpected interrupts the pain. An authority figure (a woman at the
desk, an uncle, a neighbor, a person in line) reveals the thing nobody tells
you. This is the mechanism — the program, the website, the trick. It is
delivered as a whisper, an aside, a thing almost not said. The narrator almost
missed it.

### Beat 4 — THE RESULT (2–3 sentences)
What happened when the narrator acted. Specific: what they got, what they saved,
how fast it happened. The number that replaces the burn number. The relief.
Optional: one line of disbelief ("I'm still not totally sure this is real").

### Beat 5 — THE RELUCTANT SHARE (3–5 sentences)
The narrator feels guilty posting this. They're not sure they're supposed to.
They just wanted to help people like them. Here is the link. Try it and let them
know if it worked.

---

## Voice and persona rules

1. **Real first name + real last name.** Not a business. Not "Home Makeover
   Experts." A person: "Matthew Reynolds", "Kelly White", "Sandra Torres",
   "James Okafor." The name should match the likely demographic of the audience.
2. **Typos and imperfection are assets.** One run-on sentence. One "lol". One
   ellipsis mid-thought. One sentence fragment. Not more than three — the post
   should feel like someone who types well but in a hurry, not someone who can't
   spell.
3. **No marketing words.** No "amazing", "incredible", "life-changing", no
   "limited time", no "act now." The narrator is a person, not a copywriter.
4. **The offer is named late.** The website / link / program name appears no
   earlier than Beat 4. If the reader stops before that, they never saw a pitch.
5. **The link appears twice** — once in Beat 4/5 as a plain URL (not a CTA
   button) and once at the very end as "here's the site I used." No anchor text.
   No "click here."
6. **Length:** 200–450 words. Long enough to build investment; short enough to
   read in 45 seconds. The examples in the reference images are ~300–380 words.

---

## Image brief (non-ad photo)

The image must pass as a personal phone photo. Stage 4 writes this brief and
hands it to the image adapter.

### What the image IS

A candid moment from the narrator's life that connects emotionally to the story
without showing the product or the offer. The viewer sees the image in their
feed before they see the copy. It creates a visual "I've been there" recognition
that pulls them to read.

**Examples by offer:**

| Offer | Image moment |
|-------|-------------|
| Windows | A person standing in front of drafty-looking old windows in their living room, arms crossed, looking at the glass — taken from behind or from the side, natural indoor light, slightly overexposed the way phone cameras are indoors |
| Roofing | A person in a driveway looking up at a roof with one hand shielding their eyes, casual clothes, overcast day, a car parked behind them |
| Walk-in tub | An adult sitting on the edge of a standard bathtub looking tired, or a bathroom with an old tub and worn fixtures — taken at a low angle like someone crouching to look at the tub |
| Bath conversion | A cluttered older bathroom mid-morning, natural light, no one in frame — the room itself is the subject |
| Siding | A corner of a house with visibly aged or peeling siding, someone's hand touching it, taken from a few feet away |

### Image generation constraints (every image)

```
A candid, authentic-looking phone photograph. Natural available light, slight
overexposure or slight underexposure as phone cameras produce. No studio
lighting. No props styled for a shoot. No text, no watermarks, no brand
logos, no overlays, no captions. The subject is [describe scene from table
above]. Shot at [eye level / slightly below / slightly above] in portrait
orientation (4:5 ratio). The image should look like it was taken quickly and
posted immediately — not composed or edited. No filters. Realistic skin tones.
DSLR-level sharpness is wrong; phone-camera sharpness is right. No models
who look like models.
```

**Critical:** if a person appears in the image, they must look like a real
person going about their day — not attractive in a commercial sense, not
photographed to look good. The more unremarkable the better.

---

## Stage 4 output checklist

Stage 4 delivers, in order:

1. **Persona line:** "This post is from: [Full Name], [implied location/vibe]"
2. **Post body:** the full 200–450-word story, starting with "I", following the
   five-beat arc, persona voice throughout, offer link embedded naturally.
3. **Image brief:** the scene description + the full constraints block above,
   ready to paste into the image adapter.
4. **Variants note:** offer to write 2–3 additional persona variants (different
   name, slightly different story angle, same offer) for split-testing without
   extra image cost — the same image can run under different names.

---

## Assembly notes

- No assemble.mjs involvement — this format has no video and no audio.
- The image renders via the image adapter to `05-assets/trojan-ugc-story/`.
- `disclosure: false` per hard rule 14 — no disclaimer appended to the post.
- Platform: Facebook feed primary. The copy length and link-at-the-end
  structure is native to Facebook; it reads wrong on TikTok or Instagram.

---

## Routing and cost

Copy: zero API cost (written in-session).
Image: one image-adapter call (~$0.04–0.08 per image depending on adapter).
Ten copy variants + one image: under $0.10 total and under 10 minutes.
