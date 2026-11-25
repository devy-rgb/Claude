#!/bin/zsh
# heard.sh <clip.mp4> — local whisper.cpp transcript with word timings: prints the text,
# the word count, and the END time of the last spoken word (for `seconds` trims).
set -e
CLIP="$1"; W=/tmp/heard-$$.wav
ffmpeg -y -v error -i "$CLIP" -vn -ac 1 -ar 16000 -f wav "$W"
OUT=/tmp/heard-$$
whisper-cli -m ~/.adsora/whisper/ggml-large-v3-turbo.bin -f "$W" -l en -ml 1 -oj -of "$OUT" >/dev/null 2>&1
python3 - "$OUT.json" "$CLIP" <<'PY'
import json,sys,subprocess
d=json.load(open(sys.argv[1]))
toks=[t for t in d["transcription"] if t["text"].strip() and not t["text"].startswith("[_")]
text="".join(t["text"] for t in toks).strip()
last=toks[-1]["offsets"]["to"]/1000 if toks else 0
dur=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",sys.argv[2]]).decode().strip())
print(f"FILE {sys.argv[2]}")
print(f"TEXT {text}")
print(f"WORDS {len(text.split())}  LAST_WORD_END {last:.2f}s  CLIP {dur:.2f}s")
PY
rm -f "$W" "$OUT.json"
