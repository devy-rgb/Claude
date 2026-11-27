#!/usr/bin/env python3
"""speech-end.py <clip> — the last moment of speech in a clip, from an RMS envelope: 50 ms windows,
floor = 20th percentile, speech = windows more than 12 dB over the floor. Prints seconds."""
import sys, subprocess, numpy as np, soundfile as sf, tempfile, os
clip = sys.argv[1]; w = tempfile.mktemp(suffix=".wav")
subprocess.run(["ffmpeg","-y","-v","error","-i",clip,"-vn","-ac","1","-ar","16000",w],check=True)
x, sr = sf.read(w); os.remove(w)
n = int(sr*0.05); rms = np.array([np.sqrt(np.mean(x[i:i+n]**2)+1e-12) for i in range(0, len(x)-n, n)])
db = 20*np.log10(rms); floor = np.percentile(db, 20); hot = np.where(db > floor + 12)[0]
end = (hot[-1]+1)*0.05 if len(hot) else 0.0
start = hot[0]*0.05 if len(hot) else 0.0
print(f"{end:.2f} {start:.2f}")
