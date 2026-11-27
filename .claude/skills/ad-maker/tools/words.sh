#!/bin/zsh
# words.sh <clip> → JSON list of {w,s,e} word timings from local whisper.cpp
set -e
CLIP="$1"; W=/tmp/words-$$.wav; OUT=/tmp/words-$$
ffmpeg -y -v error -i "$CLIP" -vn -ac 1 -ar 16000 -f wav "$W"
whisper-cli -m ~/.adsora/whisper/ggml-large-v3-turbo.bin -f "$W" -l en -ml 1 -oj -of "$OUT" >/dev/null 2>&1
python3 - "$OUT.json" <<'PY'
import json,sys,re
d=json.load(open(sys.argv[1])); words=[]
for t in d["transcription"]:
    txt=t["text"]
    if txt.startswith("[_") or not txt.strip(): continue
    words.append({"w":re.sub(r"[^a-z0-9']","",txt.lower()),"s":t["offsets"]["from"]/1000,"e":t["offsets"]["to"]/1000,"raw":txt})
print(json.dumps(words))
PY
rm -f "$W" "$OUT.json"
