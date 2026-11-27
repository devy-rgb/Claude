#!/bin/zsh
# chain.sh — generic Adsora Gen i2v chain: one full prompt per line, each clip seeded from the previous clip's
# last settled frame, one seed throughout, -c copy concat, joins sheet. For cartoon / silent / any style where the
# talking-head tool's real-skin template does not fit.
#   zsh chain.sh --start P.png --prompts prompts.txt --secs 9.5 [--secs-file secs.txt] --seed N --workdir DIR --out final.mp4 [--starts starts.txt]
#   --starts: optional file, one image path (or "-") per line; a path restarts the chain from that still for that clip.
set -e
TOOL="$(cd "$(dirname "$0")" && pwd)/adsoragen.mjs"
START=""; PROMPTS=""; SECS="9.5"; SECSF=""; SEED=""; WORKDIR=""; OUT=""; STARTS=""; QUALITY="480p"
while [ $# -gt 0 ]; do case "$1" in
  --start) START="$2"; shift 2;; --prompts) PROMPTS="$2"; shift 2;; --secs) SECS="$2"; shift 2;; --secs-file) SECSF="$2"; shift 2;;
  --seed) SEED="$2"; shift 2;; --workdir) WORKDIR="$2"; shift 2;; --out) OUT="$2"; shift 2;; --starts) STARTS="$2"; shift 2;; --quality) QUALITY="$2"; shift 2;;
  *) echo "unknown arg $1"; exit 2;; esac; done
[ -n "$SEED" ] || SEED=$(( RANDOM * 32768 + RANDOM ))
mkdir -p "$WORKDIR"
PR=(); while IFS= read -r l; do [ -n "${l// /}" ] && PR+=("$l"); done < "$PROMPTS"
SC=(); if [ -n "$SECSF" ]; then while IFS= read -r l; do SC+=("$l"); done < "$SECSF"; fi
ST=(); if [ -n "$STARTS" ]; then while IFS= read -r l; do ST+=("$l"); done < "$STARTS"; fi
N=${#PR[@]}; echo "chain: $N clip(s) · seed $SEED · workdir $WORKDIR"
CUR="$START"
for n in $(seq 1 $N); do
  s="${SC[$n]:-$SECS}"; alt="${ST[$n]:-}"; [ -n "$alt" ] && [ "$alt" != "-" ] && CUR="$alt"
  python3 - "$WORKDIR/i2v-$n.jobs.json" "$WORKDIR" "$CUR" "$SEED" "$n" "${PR[$n]}" "$s" "$QUALITY" <<'PY'
import json,sys
jobs,wd,start,seed,n,prompt,secs,q=sys.argv[1:]
json.dump({"outDir":wd,"aspect":"9:16","quality":q,"seed":int(seed),"jobs":[{"name":f"i2v-{n}","mode":"i2v","image":start,"prompt":prompt,"seconds":float(secs)}]},open(jobs,"w"),indent=2)
PY
  echo "=== clip $n / $N · ${s}s · start: $(basename "$CUR") ==="
  node "$TOOL" "$WORKDIR/i2v-$n.jobs.json"
  [ -f "$WORKDIR/i2v-$n.mp4" ] || { echo "clip $n did not land — stopping"; exit 1; }
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORKDIR/i2v-$n.mp4")
  T=$(python3 -c "print(max(0.0, float('$DUR')-0.3))")
  CUR="$WORKDIR/start-$((n+1)).png"; ffmpeg -y -v error -ss "$T" -i "$WORKDIR/i2v-$n.mp4" -frames:v 1 -q:v 2 "$CUR"
done
LIST="$WORKDIR/parts.txt"; : > "$LIST"; for n in $(seq 1 $N); do printf "file '%s'\n" "$WORKDIR/i2v-$n.mp4" >> "$LIST"; done
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c copy -movflags +faststart "$OUT" || ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "FINAL → $OUT"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
