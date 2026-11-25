#!/usr/bin/env python3
"""audio_check.py — how a cut dialogue scene SOUNDS. Local, free. Run in the accent venv.

  ~/.adsora/accent/bin/python tools/audio_check.py final <final.mp4> <segments.json>
  ~/.adsora/accent/bin/python tools/audio_check.py pick-ref <candidates.json>

`final` measures the finished ad, segment by segment, the way a viewer hears it:
  loudness   speech level per spoken line (95th-percentile 20 ms frame, dBFS)
  room       noise floor per segment (15th percentile) — the room tone under the cut
  gaps       silence between the end of one speaker and the start of the next
  voice      per speaker: median similarity of every pair of their lines (ECAPA speaker
             embeddings, speechbrain/spkrec-ecapa-voxceleb)
  voice_cross  per pair of speakers: median similarity across their lines (two characters
             who sound like one person score near their own self-similarity)
segments.json: [{ "start", "seconds", "heard", "speaker" }] — the assemble manifest's clips
with a "speaker" name added. Prints one JSON object.

Calibrated 2026-09-12. Voice similarity at 1.5–3 s per line: one real person 0.42–0.53;
four lines inside one generated take 0.41; the same character generated in separate clips
0.28 (heard as a different man each line); separate clips after voice conversion to one
reference 0.60–0.70. Loudness: a generated scene cut straight from native clips spread
19.5 dB across lines with 26 of 45 adjacent jumps over 4 dB; room tone spread 16 dB.

`pick-ref` chooses each speaker's voice-conversion reference: of their lines with at least
3 s of speech, the one whose voice sits closest to all their other lines (the most typical
timbre, not an outlier). candidates.json: { "speaker": ["line.wav", ...] }.
"""
import sys, json, os, subprocess, tempfile, warnings, logging, io, contextlib, itertools, statistics as st
warnings.filterwarnings("ignore"); logging.disable(logging.WARNING)
import numpy as np

SR = 16000

def pcm(path, ss=None, t=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(ss)] if ss is not None else []) + (["-t", str(t)] if t is not None else []) + \
          ["-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.int16).astype(np.float32) / 32768

def frames_db(x, win=0.02):
    n = int(win * SR)
    if len(x) < n: return np.array([-90.0])
    k = len(x) // n
    f = x[: k * n].reshape(k, n)
    return 10 * np.log10(np.mean(f ** 2, axis=1) + 1e-12)

_enc = None
def encoder():
    global _enc
    if _enc is None:
        import torch
        with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
            from speechbrain.inference.speaker import EncoderClassifier
            _enc = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb",
                savedir=os.path.expanduser("~/.adsora/accent/models/spkrec-ecapa"), run_opts={"device": "cpu"})
    return _enc

def embed(x):
    import torch
    with torch.no_grad():
        return torch.nn.functional.normalize(encoder().encode_batch(torch.from_numpy(x).unsqueeze(0))[0, 0], dim=0)

def speech_span(x):
    d = frames_db(x); floor = np.percentile(d, 15); on = np.where(d > floor + 12)[0]
    return (on[0] * 0.02, (on[-1] + 1) * 0.02, float(len(on) * 0.02)) if len(on) else (None, None, 0.0)

def final(video, segfile):
    segs = json.load(open(segfile))
    full = pcm(video)
    rows = []
    for i, s in enumerate(segs):
        a, b = int(s["start"] * SR), int((s["start"] + s["seconds"]) * SR)
        x = full[a:b]; d = frames_db(x)
        first, last, voiced = speech_span(x)
        spoken = bool(str(s.get("heard", "")).strip())
        rows.append({"i": i + 1, "speaker": s.get("speaker"), "spoken": spoken, "start": s["start"], "seconds": s["seconds"],
                     "floor": round(float(np.percentile(d, 15)), 1), "speech": round(float(np.percentile(d, 95)), 1) if spoken else None,
                     "first": first, "last": last, "voiced": voiced, "x": x if spoken else None})
    out = {"loudness_jumps": [], "room_jumps": [], "gaps": [], "voice": {}}
    sp = [r for r in rows if r["spoken"]]
    for p, q in zip(sp, sp[1:]):
        if abs(q["speech"] - p["speech"]) > 4:
            out["loudness_jumps"].append({"from": p["i"], "to": q["i"], "db": round(q["speech"] - p["speech"], 1)})
        if p["last"] is not None and q["first"] is not None and q["i"] == p["i"] + 1:
            out["gaps"].append({"from": p["i"], "to": q["i"], "seconds": round((q["start"] + q["first"]) - (p["start"] + p["last"]), 2),
                                "same_speaker": p["speaker"] == q["speaker"]})
    for p, q in zip(rows, rows[1:]):
        if abs(q["floor"] - p["floor"]) > 6:
            out["room_jumps"].append({"from": p["i"], "to": q["i"], "db": round(q["floor"] - p["floor"], 1)})
    speech_levels = [r["speech"] for r in sp]
    floors = [r["floor"] for r in rows]
    out["speech_spread_db"] = round(max(speech_levels) - min(speech_levels), 1) if speech_levels else 0
    out["room_spread_db"] = round(max(floors) - min(floors), 1)
    g = [x["seconds"] for x in out["gaps"] if not x["same_speaker"]]
    out["turn_gap_median"] = round(st.median(g), 2) if g else None
    by = {}
    for r in sp:
        if r["speaker"]: by.setdefault(r["speaker"], []).append(r)
    embs = {}
    for spk, rs0 in by.items():
        # Lines with 0.8 s+ of speech embed reliably. A character who only has short lines (the
        # 2026-09-13 drama's Rob: 8 lines, 0.7–3.5 s) used to drop out of this check entirely; fall
        # back to 0.4 s+ so every speaking character is measured.
        rs = [r for r in rs0 if r["voiced"] >= 0.8]
        if len(rs) < 3: rs = [r for r in rs0 if r["voiced"] >= 0.4]
        if len(rs) < 3: continue
        es = [embed(r["x"]) for r in rs]; embs[spk] = es
        sims = [float(a @ b) for a, b in itertools.combinations(es, 2)]
        mean_to_rest = [(float(np.mean([float(es[k] @ es[j]) for j in range(len(es)) if j != k])), rs[k]["i"]) for k in range(len(es))]
        out["voice"][spk] = {"lines": len(rs), "median": round(st.median(sims), 3), "least_like_self": sorted(mean_to_rest)[:3]}
    # Two characters converted toward similar references can end up sounding like one person.
    # Measured on the drama: different characters 0.04–0.26, the same character 0.44–0.59.
    out["voice_cross"] = [{"a": a, "b": b, "median": round(st.median([float(x @ y) for x in embs[a] for y in embs[b]]), 3)}
                          for a, b in itertools.combinations(sorted(embs), 2)]
    print(json.dumps(out))

def pick_ref(candfile):
    cands = json.load(open(candfile)); out = {}
    for spk, files in cands.items():
        xs = [(f, pcm(f)) for f in files]
        long = [(f, x) for f, x in xs if speech_span(x)[2] >= 3.0] or sorted(xs, key=lambda fx: -speech_span(fx[1])[2])[:3]
        es = {f: embed(x) for f, x in xs}
        best = max(long, key=lambda fx: np.mean([float(es[fx[0]] @ es[g]) for g in es if g != fx[0]]))
        out[spk] = best[0]
    print(json.dumps(out))

if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "final": final(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 3 and sys.argv[1] == "pick-ref": pick_ref(sys.argv[2])
    else: print(__doc__); sys.exit(2)
