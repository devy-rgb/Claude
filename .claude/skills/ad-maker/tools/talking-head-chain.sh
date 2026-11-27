#!/bin/zsh
# talking-head-chain.sh — a long talking-face read on Adsora Gen as chained i2v
# clips with H3's OWN native audio (lips and voice from the same pass), the face
# locked by start-frame chaining. The house recipe: references/talking-head-long-form.md
#
#   zsh tools/talking-head-chain.sh --portrait P.png --who "…" --scene "…" \
#        --chunks chunks.txt --out final.mp4 [--accent "…"] [--beats beats.txt] \
#        [--seed N] [--quality 480p|720p] [--workdir DIR] [--slug NAME]
#
#   --portrait  settled, CLOSED-LIP, eyes-to-lens frame of the presenter (see §2 of the reference)
#   --who       presenter description, e.g. "A white man in his late 40s in a collared shirt"
#   --scene     environment phrase that follows the presenter, e.g.
#               "sits at a tidy office desk, a state flag on a pole behind them, warm window light"
#   --chunks    text file, ONE script chunk per line, sentence-bounded, ≤ ~29 words each
#   --out       final mp4 path (the four+ clips are concatenated here with -c copy)
#   --accent    default "neutral American accent" (hard rule 17); name a vernacular only when the run does
#   --beats     optional text file, one performance beat per line, parallel to --chunks
#   --seed      shared by EVERY clip (default: random once, then fixed for the whole chain)
#   --spw       seconds per word (default 0.4) and --slack seconds added per clip (default 1.5):
#               the clip-length formula. Probe before lowering them — H3 fills the clip it is
#               given, so a shorter clip is a faster read only up to the point words get cut.
#   --pace      optional delivery phrase inserted before the beat, e.g. "talking fast, a quick
#               brisk pace with no pauses between sentences, every word clearly enunciated"
#
# Seconds per chunk = 0.4 × words + 1.5 (cap 15.0, floor 5.2) — the slack lets the
# mouth close so each clip's last frame is a clean seed for the next.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
TOOL="$HERE/adsoragen.mjs"
PORTRAIT=""; WHO=""; SCENE=""; CHUNKS=""; OUT=""; BEATS=""; WORKDIR=""; SLUG=""
ACCENT="neutral American accent"; SEED=""; QUALITY="480p"; SPW="0.4"; SLACK="1.5"; PACE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --portrait) PORTRAIT="$2"; shift 2;;  --who) WHO="$2"; shift 2;;
    --scene) SCENE="$2"; shift 2;;        --chunks) CHUNKS="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;            --accent) ACCENT="$2"; shift 2;;
    --beats) BEATS="$2"; shift 2;;        --seed) SEED="$2"; shift 2;;
    --quality) QUALITY="$2"; shift 2;;    --workdir) WORKDIR="$2"; shift 2;;
    --slug) SLUG="$2"; shift 2;;
    --spw) SPW="$2"; shift 2;;            --slack) SLACK="$2"; shift 2;;
    --pace) PACE="$2"; shift 2;;
    *) echo "unknown arg: $1"; exit 2;;
  esac
done
for v in PORTRAIT WHO SCENE CHUNKS OUT; do
  [ -n "${(P)v}" ] || { echo "missing --$(echo $v | tr 'A-Z' 'a-z')"; exit 2; }
done
[ -f "$PORTRAIT" ] || { echo "portrait not found: $PORTRAIT"; exit 2; }
[ -f "$CHUNKS" ] || { echo "chunks file not found: $CHUNKS"; exit 2; }
[ -f "$TOOL" ] || { echo "adsoragen.mjs not found next to this script"; exit 2; }
[ -n "$SLUG" ] || SLUG="$(basename "$OUT" .mp4)"
[ -n "$WORKDIR" ] || WORKDIR="$(dirname "$OUT")/$SLUG-chain"
[ -n "$SEED" ] || SEED=$(( RANDOM * 32768 + RANDOM ))
mkdir -p "$WORKDIR"

# read chunks (and optional beats) into arrays; skip blank lines
CH=(); while IFS= read -r line; do [ -n "${line// /}" ] && CH+=("$line"); done < "$CHUNKS"
BT=(); if [ -n "$BEATS" ] && [ -f "$BEATS" ]; then while IFS= read -r line; do BT+=("$line"); done < "$BEATS"; fi
N=${#CH[@]}
[ "$N" -ge 1 ] || { echo "no chunks in $CHUNKS"; exit 2; }
echo "chain: $N clip(s) · seed $SEED · $QUALITY · workdir $WORKDIR"

START="$PORTRAIT"
for n in $(seq 1 $N); do
  chunk="${CH[$n]}"
  beat="${BT[$n]:-steady direct eye contact, one small natural hand beat}"
  words=$(echo "$chunk" | wc -w | tr -d ' ')
  secs=$(python3 -c "w=$words; s=$SPW*w+$SLACK; print(round(min(15.0,max(5.2,s)),1))")
  JOBS="$WORKDIR/i2v-$n.jobs.json"
  python3 - "$JOBS" "$WORKDIR" "$START" "$SEED" "$n" "$chunk" "$secs" "$beat" "$WHO" "$SCENE" "$ACCENT" "$QUALITY" "$PACE" <<'PY'
import json,sys
jobs,wd,start,seed,n,chunk,secs,beat,who,scene,accent,quality,pace=sys.argv[1:]
pace=(", "+pace) if pace else ""
prompt=(f"Vertical 9:16 UGC close-up, one continuous take continuing the same shot. {who} {scene}, "
        f"calm confident spokesperson looking straight into the lens, speaking with a {accent}{pace}; {beat}. "
        f"\"{chunk}\" Then a pause with a calm closed-lip smile, mouth still. "
        f"Locked-off framing, natural realistic skin, no on-screen text, no captions.")
json.dump({"outDir":wd,"aspect":"9:16","quality":quality,"seed":int(seed),
           "jobs":[{"name":f"i2v-{n}","mode":"i2v","image":start,"prompt":prompt,"seconds":float(secs)}]},
          open(jobs,"w"),indent=2)
PY
  echo "=== clip $n / $N · $words words → ${secs}s · start: $(basename "$START") ==="
  node "$TOOL" "$JOBS"
  CLIP="$WORKDIR/i2v-$n.mp4"
  [ -f "$CLIP" ] || { echo "clip $n did not land — stopping"; exit 1; }
  if [ "$n" -lt "$N" ]; then
    DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CLIP")
    T=$(python3 -c "print(max(0.0, float('$DUR')-0.3))")
    START="$WORKDIR/start-$((n+1)).png"
    ffmpeg -y -v error -ss "$T" -i "$CLIP" -frames:v 1 -q:v 2 "$START"
  fi
done

echo "=== concat ==="
LIST="$WORKDIR/parts.txt"; : > "$LIST"
for n in $(seq 1 $N); do printf "file '%s'\n" "$WORKDIR/i2v-$n.mp4" >> "$LIST"; done
mkdir -p "$(dirname "$OUT")"
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c copy -movflags +faststart "$OUT" \
  || ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart "$OUT"

# joins sheet for the QA step: last frame of clip n beside first frame of clip n+1
if [ "$N" -ge 2 ]; then
  k=1; cd "$WORKDIR"
  for n in $(seq 1 $((N-1))); do
    ffmpeg -y -v error -sseof -0.05 -i "i2v-$n.mp4" -frames:v 1 "$(printf 'join-%02d.png' $k)"; k=$((k+1))
    ffmpeg -y -v error -i "i2v-$((n+1)).mp4" -frames:v 1 "$(printf 'join-%02d.png' $k)"; k=$((k+1))
  done
  ffmpeg -y -v error -i 'join-%02d.png' -vf "scale=240:-1,tile=2x$((N-1))" -frames:v 1 joins-sheet.png && echo "joins sheet → $WORKDIR/joins-sheet.png (check before sending)"
fi

echo "FINAL → $OUT"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of csv=p=0 "$OUT" | tr '\n' ' '
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,channels -of csv=p=0 "$OUT"
