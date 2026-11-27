#!/usr/bin/env python3
"""accent_check.py — is this clip's speech North American? Local, free, no API.

  ~/.adsora/accent/bin/python tools/accent_check.py a.wav [b.mp4 ...]

Prints one JSON line per file. Model: CommonAccent ECAPA
(Jzuluaga/accent-id-commonaccent_ecapa), downloaded once into
~/.adsora/accent/models. The classifier's raw outputs are cosine scores, not
probabilities — softmaxing them flattens every class to ~0.1 and is useless —
so the verdict is a MARGIN on raw scores: best North American class (us, canada;
this model cannot separate General American from Canadian) minus the best of
every other accent. Calibrated 2026-09-12 on 24 clips: real and generated
American speech scored +0.17 to +0.49, generated British speech -0.27 to -0.62.
PASS at >= +0.10.

Setup (once):
  uv venv --python 3.11 ~/.adsora/accent
  uv pip install --python ~/.adsora/accent/bin/python speechbrain==1.0.3 \
      torch==2.5.1 torchaudio==2.5.1 soundfile "huggingface_hub<0.26"
"""
import sys, json, os, subprocess, tempfile, warnings, logging
warnings.filterwarnings("ignore"); logging.disable(logging.WARNING)
os.environ.setdefault("TQDM_DISABLE", "1")

NORTH_AMERICA = {"us", "canada"}
THRESHOLD = float(os.environ.get("ACCENT_MARGIN", "0.10"))

def to_wav(path):
    if path.lower().endswith(".wav"):
        return path, None
    fd, out = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vn", "-ac", "1", "-ar", "16000", out], check=True)
    return out, out

def main(paths):
    import contextlib, io
    with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
        import torch, torchaudio
        from speechbrain.inference.classifiers import EncoderClassifier
        clf = EncoderClassifier.from_hparams(
            source="Jzuluaga/accent-id-commonaccent_ecapa",
            savedir=os.path.expanduser("~/.adsora/accent/models/commonaccent_ecapa"),
            run_opts={"device": "cpu"})
    labels = clf.hparams.label_encoder.ind2lab
    for p in paths:
        wav, tmp = to_wav(p)
        try:
            sig, sr = torchaudio.load(wav)
            if sig.shape[0] > 1: sig = sig.mean(0, keepdim=True)
            if sr != 16000: sig = torchaudio.functional.resample(sig, sr, 16000)
            if sig.shape[1] < 16000:
                print(json.dumps({"file": p, "verdict": "SKIP", "reason": "under 1 s of audio"})); continue
            with contextlib.redirect_stderr(io.StringIO()):
                raw = clf.classify_batch(sig)[0][0]
            s = {labels[i]: float(raw[i]) for i in range(len(labels))}
            na = max((v, k) for k, v in s.items() if k in NORTH_AMERICA)
            ot = max((v, k) for k, v in s.items() if k not in NORTH_AMERICA)
            margin = round(na[0] - ot[0], 3)
            print(json.dumps({"file": p, "verdict": "PASS" if margin >= THRESHOLD else "FAIL",
                              "margin": margin, "north_america": [na[1], round(na[0], 3)],
                              "closest_other": [ot[1], round(ot[0], 3)], "threshold": THRESHOLD}))
        finally:
            if tmp: os.remove(tmp)

if __name__ == "__main__":
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    main(sys.argv[1:])
