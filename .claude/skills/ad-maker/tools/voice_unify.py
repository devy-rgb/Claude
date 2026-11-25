#!/usr/bin/env python3
"""voice_unify.py — one voice per character across a dialogue scene. Local, free.
Run in the Chatterbox venv:

  ~/.adsora/vc-chatterbox/bin/python tools/voice_unify.py <unify.json>

Why: a native-audio video model (Adsora Gen H3, Seedance, Omni) invents a fresh voice for
every clip from the text description. One line per clip is what keeps the edit correct, and
it also means a 19-line character gets 19 different voices — measured 2026-09-12 at a median
speaker similarity of 0.28 across his lines, where one real person scores 0.42–0.53.

What it does, per line, keeping the performance and the lip-sync:
  1. cuts the clip's audio to exactly the edit window (in, seconds)
  2. converts the voice to that character's single reference with Chatterbox VC — timing is
     preserved (measured within 20 ms), so the lips still match; the words and the acting stay
  3. pads or trims to exactly `seconds`
  4. levels every line to the same speech loudness (target dBFS on the voiced frames, then a
     peak ceiling) so the volume does not jump at the cut
  5. writes a 48 kHz stereo wav for `assemble.json` → the clip's `"audio"`
It can also lay one continuous room-tone bed under the whole scene, so the background does
not change at every cut (converted voices are dry; the clips' own room tone differs per clip).

unify.json:
{
  "out": "05-assets/drama/lines",
  "refs": { "carl": "ref-carl.wav", ... },     // from audio_check.py pick-ref
  "target_db": -20,                             // speech level on voiced frames, dBFS
  "lines": [ { "name": "L01-carl", "clip": "clips/L01-carl.mp4", "in": 0.12, "seconds": 4.0, "speaker": "carl",
               "line": "No. That's not how floors work." }, ... ],   // "line" enables the word check
  "tighten": { "lead": 0.08, "tail": 0.12, "floor_db": -48 },   // optional: cut each dry line to its speech;
                                                                //  the manifest's "in"/"seconds" then drive the edit
  "holds": { "L27-pam": 0.6, "L50-den2": 0.6 },   // optional: a deliberate beat BEFORE these lines (seconds)
  "bed": { "seconds": 131.0, "roomtone_from": ["clips/RX-carl.mp4", ...], "roomtone_db": -50,
           "music": "Soundtracks/x.mp3", "music_gain": 0.04, "file": "bed.wav" }      // optional
}
Result sanity: after conversion the same character's lines scored 0.60–0.70 against each other.

Pacing (measured 2026-09-13 on the drama): the native clips leave 0.3–0.6 s of air round every
line, so a straight cut ran 0.41 s median / 1.12 s worst between speakers and dragged. `tighten`
cuts every line to its own speech: every cut then sits at ~0.2 s, which is right for a volley and
wrong for a beat — 46 identical pauses play like a metronome. `holds` puts the beats back where the
script turns (a new character walks in, a number lands, the button before the last line). A hold
goes on the HEAD of the line (the next speaker's face, reacting, before they talk) when the clip's
own lip-synced audio is silent there — silent native audio means a still mouth — else on the TAIL
of the line before, else it is reported unplaced. Holds rebuild from `<name>.dry.wav`, so changing
them never needs the voice pass again:

  tools/voice_unify.py unify.json --holds-only        # re-apply holds to the existing lines
  tools/voice_unify.py unify.json --only L24-den      # re-convert named lines, merge, re-apply holds
"""
import sys, json, os, subprocess, tempfile, warnings
warnings.filterwarnings("ignore")
import numpy as np, soundfile as sf

def ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, a)], check=True)

def level(x, sr, target_db, ceiling_db=-1.0):
    n = int(0.02 * sr); k = len(x) // n
    if k == 0: return x
    fr = x[: k * n].reshape(k, n); db = 10 * np.log10(np.mean(fr ** 2, axis=1) + 1e-12)
    floor = np.percentile(db, 15); on = fr[db > floor + 12]
    if not len(on): return x
    cur = 10 * np.log10(np.mean(on ** 2) + 1e-12)
    y = x * (10 ** ((target_db - cur) / 20))
    peak = np.max(np.abs(y)) + 1e-9; ceil = 10 ** (ceiling_db / 20)
    return y * (ceil / peak) if peak > ceil else y

WHISPER_MODEL = os.path.expanduser(os.environ.get("WHISPER_MODEL", "~/.adsora/whisper/ggml-large-v3-turbo.bin"))
def heard(path):
    w = path + ".16k.wav"
    ff("-i", path, "-ac", 1, "-ar", 16000, "-af", "apad=pad_dur=0.6", w)
    r = subprocess.run(["whisper-cli", "-m", WHISPER_MODEL, "-f", w, "-np", "-nt"], capture_output=True, text=True)
    os.remove(w); return r.stdout.strip()
NUM = {"zero":"0","one":"1","two":"2","three":"3","four":"4","five":"5","six":"6","seven":"7","eight":"8","nine":"9","ten":"10","eleven":"11","twelve":"12",
       "thirteen":"13","fourteen":"14","fifteen":"15","twenty":"20","thirty":"30","forty":"40","fifty":"50","hundred":"00","thousand":"000"}
def toks(s):
    import re
    s = re.sub(r"(\d),(\d{3})", r"\1\2", s.lower()).replace("-", " ")
    return [NUM.get(w, w) for w in re.sub(r"[^a-z0-9' ]+", " ", s).split()]
def words_ok(line, got):
    """True when the converted line still says the script: 90% of its words, and its first and last."""
    import re
    if not line: return True
    want, have = toks(line), toks(got)
    letters = lambda xs: re.sub(r"[^a-z0-9]", "", "".join(xs))
    if letters(want) in letters(have): return True
    cov = sum(1 for w in want if w in have) / max(1, len(want))
    return cov >= 0.9 and want[0] in have and want[-1] in have

def clip_speech_frames(clip, _cache={}):
    """The clip's own audio → (voiced mask per 20 ms frame, duration). The model's track is lip-synced,
    so a frame with no speech in it is a frame where the mouth is not moving."""
    if clip not in _cache:
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", clip, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True)
        x = np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768; n = 320; k = len(x) // n
        db = 10 * np.log10(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1) + 1e-12)
        _cache[clip] = (db > np.percentile(db, 15) + 12, len(x) / 16000)
    return _cache[clip]

def mouth_still(clip, a, b, touches):
    """No speech in [a, b] of the clip, with a 40 ms margin on the outer edge. The edge that `touches`
    the line ("b" for a head hold, "a" for a tail hold) meets the line's own first/last word, so it
    gets no margin — the detector's onset sits a frame or two inside the tightened window."""
    voiced, dur = clip_speech_frames(clip)
    if a < 0 or b > dur - 0.04: return False
    lo = a + 0.02 if touches == "a" else max(0, a - 0.04)
    hi = b - 0.02 if touches == "b" else b + 0.04
    return not voiced[int(lo / 0.02): int(np.ceil(hi / 0.02))].any()

def apply_holds(cfg, manifest, tmp):
    holds = cfg.get("holds") or {}
    for x in manifest:   # always start from the dry line, so holds can be changed and re-applied
        dry = x["file"][:-4] + ".dry.wav"
        x.setdefault("dry_in", x["in"]); x.setdefault("dry_seconds", x["seconds"])
        x["in"], x["seconds"] = x["dry_in"], x["dry_seconds"]; x.pop("hold", None)
        if not os.path.exists(dry): ff("-i", x["file"], "-c", "copy", dry)   # lines written before holds existed
        else: ff("-i", dry, "-c", "copy", x["file"])
    for i, x in enumerate(manifest):
        h = holds.get(x["name"])
        if not h: continue
        prev = manifest[i - 1] if i > 0 else None
        if mouth_still(x["clip"], x["in"] - h, x["in"], "b"):
            ff("-i", x["file"][:-4] + ".dry.wav", "-af", f"adelay={int(h * 1000)}:all=1", x["file"])
            x["in"] = round(x["in"] - h, 3); x["seconds"] = round(x["seconds"] + h, 3); x["hold"] = {"before": h, "on": "head"}
        elif prev and mouth_still(prev["clip"], prev["in"] + prev["seconds"], prev["in"] + prev["seconds"] + h, "a"):
            prev["seconds"] = round(prev["seconds"] + h, 3); prev["hold"] = {"after": h, "on": "tail"}
            ff("-i", prev["file"], "-af", f"apad=pad_dur={h}", os.path.join(tmp, "p.wav")); ff("-i", os.path.join(tmp, "p.wav"), prev["file"])
        else:
            x["hold"] = {"before": h, "on": "unplaced"}
        where = x["hold"]["on"] if x.get("hold") else "tail of " + prev["name"]
        print(f"{'!' if where == 'unplaced' else '✓'} hold {h:.2f}s before {x['name']:<12} on {where}")

HOLDS_ONLY = "--holds-only" in sys.argv
ONLY = next((sys.argv[i + 1].split(",") for i, a in enumerate(sys.argv) if a == "--only" and i + 1 < len(sys.argv)), None)

def main(cfg_path):
    cfg = json.load(open(cfg_path)); base = os.path.dirname(os.path.abspath(cfg_path))
    P = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
    out = P(cfg["out"]); os.makedirs(out, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="unify-")
    if not HOLDS_ONLY:
        import torch
        from chatterbox.vc import ChatterboxVC
        dev = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
        vc = ChatterboxVC.from_pretrained(dev)
    only = set(ONLY) if ONLY else None
    old = {}
    mpath = os.path.join(out, "unify-manifest.json")
    if (only is not None or HOLDS_ONLY) and os.path.exists(mpath): old = {x["name"]: x for x in json.load(open(mpath))}
    manifest = []
    todo = [] if HOLDS_ONLY else [L for L in cfg["lines"] if only is None or L["name"] in only]
    for L in todo:
        src = os.path.join(tmp, f"{L['name']}.src.wav")
        ff("-ss", L["in"], "-t", L["seconds"], "-i", P(L["clip"]), "-vn", "-ac", "1", "-ar", 24000, src)
        sr = vc.sr; want = int(round(float(L["seconds"]) * sr)); PAD = 0.35
        # Voice conversion can swallow a word at a fast edge (measured: "tears that quote up" came back
        # "tears that quota"). Every converted line is transcribed against its script. Retry once with
        # silence padded round the source (the edge words are then mid-file), then keep the ORIGINAL voice
        # for that line — a slightly different voice beats a wrong word.
        how = "vc"
        y = vc.generate(src, target_voice_path=P(cfg["refs"][L["speaker"]])).squeeze().cpu().numpy().astype(np.float32)
        probe = os.path.join(tmp, f"{L['name']}.probe.wav"); sf.write(probe, y, sr)
        if not words_ok(L.get("line"), heard(probe)):
            padded = os.path.join(tmp, f"{L['name']}.pad.wav")
            ff("-i", src, "-af", f"adelay={int(PAD*1000)},apad=pad_dur={PAD}", "-ar", 24000, padded)
            y2 = vc.generate(padded, target_voice_path=P(cfg["refs"][L["speaker"]])).squeeze().cpu().numpy().astype(np.float32)
            y2 = y2[int(PAD * sr): int(PAD * sr) + want]
            sf.write(probe, y2, sr)
            if words_ok(L.get("line"), heard(probe)): y, how = y2, "vc-padded"
            else:
                y, _ = sf.read(src); y = y.astype(np.float32); how = "original-voice"
        drift = (len(y) - want) / sr
        y = np.pad(y, (0, max(0, want - len(y))))[:want]
        y = level(y, sr, cfg.get("target_db", -20))
        head_trim = 0.0
        T = cfg.get("tighten")
        if T and how != "original-voice":
            # The converted line is dry, so its speech edges are exact: cut to them, keep a little air,
            # and report how much came off the head so the edit shifts the picture by the same amount.
            n = int(0.01 * sr); k = len(y) // n
            db = 20 * np.log10(np.sqrt(np.mean(y[: k * n].reshape(k, n) ** 2, axis=1)) + 1e-9)
            on = np.where(db > T.get("floor_db", -48))[0]
            if len(on):
                a0 = max(0, on[0] * n - int(T.get("lead", 0.08) * sr)); a1 = min(len(y), (on[-1] + 1) * n + int(T.get("tail", 0.12) * sr))
                if a1 - a0 > int(0.25 * sr): head_trim = a0 / sr; y = y[a0:a1]
        mono = os.path.join(tmp, f"{L['name']}.vc.wav"); sf.write(mono, y, sr)
        dst = os.path.join(out, f"{L['name']}.wav")
        ff("-i", mono, "-ar", 48000, "-ac", 2, dst)
        ff("-i", mono, "-ar", 48000, "-ac", 2, dst[:-4] + ".dry.wav")
        manifest.append({"name": L["name"], "file": dst, "clip": P(L["clip"]), "seconds": round(len(y) / sr, 3), "head_trim_s": round(head_trim, 3),
                         "in": round(float(L["in"]) + head_trim, 3), "timing_drift_s": round(drift, 3), "voice": how})
        print(f"{'✓' if how != 'original-voice' else '!'} {L['name']:<12} {L['speaker']:<7} drift {drift*1000:+.0f} ms  {how}")
    done = {x["name"]: x for x in manifest}
    manifest = [done.get(L["name"]) or old.get(L["name"]) for L in cfg["lines"]]
    if any(x is None for x in manifest): sys.exit("manifest is missing lines — run the full pass first")
    for L, x in zip(cfg["lines"], manifest): x.setdefault("clip", P(L["clip"]))
    apply_holds(cfg, manifest, tmp)
    if cfg.get("bed") and not (HOLDS_ONLY or only):
        B = cfg["bed"]; dur = float(B["seconds"])
        # room tone: the quietest middle second of each silent clip, looped with crossfades
        best = None
        for c in B.get("roomtone_from", []):
            t = os.path.join(tmp, "rt.wav"); ff("-ss", 1.5, "-t", 2.5, "-i", P(c), "-vn", "-ac", "1", "-ar", 48000, t)
            x, sr = sf.read(t); r = float(np.sqrt(np.mean(x ** 2)) + 1e-12)
            if best is None or r < best[0]: best = (r, x.copy())
        parts = []
        if best is not None:
            x = best[1]; x = x * (10 ** ((B.get("roomtone_db", -50) - 20 * np.log10(best[0])) / 20))
            fade = int(0.25 * 48000); seg = len(x) - fade; n = int(np.ceil(dur * 48000 / seg)) + 1
            bed = np.zeros(seg * n + fade, dtype=np.float32); ramp = np.linspace(0, 1, fade)
            for k in range(n):
                y = x.copy(); y[:fade] *= ramp; y[-fade:] *= ramp[::-1]
                bed[k * seg : k * seg + len(y)] += y
            rt = os.path.join(tmp, "roomtone.wav"); sf.write(rt, bed[: int(dur * 48000)], 48000); parts.append(rt)
        dst = P(B.get("file", "bed.wav"))
        if B.get("music"):
            chain = f"[0:a]aresample=48000,volume={B.get('music_gain', 0.04)},atrim=0:{dur},apad=whole_dur={dur}[m]"
            if parts: ff("-i", P(B["music"]), "-i", parts[0], "-filter_complex", f"{chain};[1:a]aresample=48000[r];[m][r]amix=inputs=2:normalize=0:duration=longest,atrim=0:{dur}", "-ac", 2, dst)
            else: ff("-i", P(B["music"]), "-filter_complex", chain, "-map", "[m]", "-ac", 2, dst)
        elif parts: ff("-i", parts[0], "-ac", 2, dst)
        json.dump({"built_by": "voice_unify.py", "music": P(B["music"]) if B.get("music") else None,
                   "roomtone_from": [P(c) for c in B.get("roomtone_from", [])]}, open(dst + ".json", "w"), indent=2)
        print(f"✓ bed → {dst} ({dur:.1f} s)")
    json.dump(manifest, open(mpath, "w"), indent=2)
    worst = max((abs(m["timing_drift_s"]) for m in manifest), default=0)
    print(f"{len(manifest)} lines → {out}  (worst timing drift {worst*1000:.0f} ms)")

if __name__ == "__main__":
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    main(sys.argv[1])
