#!/usr/bin/env bash
# Download distinct creatives, transcribe video, OCR the hook frames.
#   ./media.sh <niche> <YYYY-MM-DD>
#
# CONTENT-ADDRESSED: every creative, transcript, OCR read and frame is stored
# ONCE under <niche>/_creatives|_transcripts|_ocr|_frames, keyed by creative
# hash. The dated page folder gets a relative SYMLINK, so the
# bucket/page/date tree still shows every creative that page ran that week
# without storing a second copy.
#
# Consequence: a creative that ran last week is never re-downloaded and never
# re-transcribed. Only genuinely new creatives cost bandwidth or whisper time,
# and `creatives-new.json` records exactly which ones those were.
#
# Ad Library media URLs are short-lived signed links — run the same day as the
# harvest or the new ones 403.
set -uo pipefail
NICHE="${1:-roofing}"; DATE="${2:-$(date +%F)}"
BASE="$HOME/Documents/AdLibraryResearch/fb-ad-library/$NICHE"
RUN="$BASE/_reports/$DATE"
STORE="$BASE/_creatives"; TX="$BASE/_transcripts"; OC="$BASE/_ocr"; FR="$BASE/_frames"
MODEL="$HOME/.ad-research/whisper/ggml-large-v3-turbo.bin"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$STORE" "$TX" "$OC" "$FR" "$RUN"

# ── 0. migrate any legacy real files (pre-store runs) into the store ─────────
migrated=0
while IFS= read -r f; do
  [ -L "$f" ] && continue
  b="$(basename "$f")"; ext="${b##*.}"; stem="${b%.*}"; hash="${stem##*-}"
  [ -z "$hash" ] && continue
  if [ -s "$STORE/$hash.$ext" ]; then rm -f "$f"; else mkdir -p "$STORE"; mv "$f" "$STORE/$hash.$ext"; fi
  ln -sfn "$(python3 -c 'import os,sys;print(os.path.relpath(sys.argv[1],sys.argv[2]))' "$STORE/$hash.$ext" "$(dirname "$f")")" "$f"
  migrated=$((migrated+1))
done < <(find "$BASE" -path "*/creatives/*" -type f 2>/dev/null)
[ "$migrated" -gt 0 ] && echo "  migrated $migrated legacy file(s) into the store"

for d in "$TX" "$OC"; do
  while IFS= read -r f; do
    b="$(basename "$f" .txt)"; hash="${b##*-}"
    [ "$b" = "$hash" ] && continue
    [ -s "$d/$hash.txt" ] && rm -f "$f" || mv "$f" "$d/$hash.txt"
  done < <(find "$d" -name "*-*.txt" -type f 2>/dev/null)
done
# fold legacy per-run transcript/ocr dirs into the shared stores
for leg in "$RUN/transcripts:$TX" "$RUN/ocr:$OC"; do
  src="${leg%%:*}"; dst="${leg##*:}"
  [ -d "$src" ] || continue
  while IFS= read -r f; do
    b="$(basename "$f" .txt)"; hash="${b##*-}"
    [ -s "$dst/$hash.txt" ] || cp "$f" "$dst/$hash.txt"
  done < <(find "$src" -name "*.txt" -type f 2>/dev/null)
done
[ -d "$RUN/frames" ] && [ ! -L "$RUN/frames" ] && cp -n "$RUN/frames"/*.jpg "$FR"/ 2>/dev/null
# re-key legacy frames <adId>-<hash>-t0.5.jpg -> <hash>-t0.5.jpg so the OCR step
# below finds them; otherwise every frame gets re-extracted on the next run.
while IFS= read -r f; do
  b="$(basename "$f")"; rest="${b#*-}"            # <hash>-t0.5.jpg
  [ -e "$FR/$rest" ] && rm -f "$f" || mv "$f" "$FR/$rest"
done < <(find "$FR" -maxdepth 1 -type f -name '[0-9]*-*-t*.jpg' 2>/dev/null)

# ── 1. download only creatives the store has never seen ─────────────────────
node -e '
const m=require(process.argv[1]+"/creatives-manifest.json");
for(const c of m){const p=c.file.split("/"); const ext=p[2].split(".").pop();
  console.log([p[0]+"/"+p[1]+"/"+process.argv[2]+"/creatives",p[2],c.media,c.hash,ext].join("\t"));}
' "$RUN" "$DATE" > "$TMP/dl.tsv"

rel() { python3 -c 'import os,sys;print(os.path.relpath(sys.argv[1],sys.argv[2]))' "$1" "$2"; }
: > "$TMP/new.txt"; had=0
while IFS=$'\t' read -r dir name url hash ext; do
  mkdir -p "$BASE/$dir"
  if [ -s "$STORE/$hash.$ext" ]; then had=$((had+1)); else
    echo "$hash.$ext" >> "$TMP/new.txt"
    ( curl -sS -L -m 90 --retry 2 "$url" -o "$STORE/$hash.$ext" 2>/dev/null || rm -f "$STORE/$hash.$ext" ) &
    while [ "$(jobs -rp | wc -l)" -ge 8 ]; do wait -n 2>/dev/null || sleep 0.2; done
  fi
done < "$TMP/dl.tsv"
wait
# link every creative this run saw into its dated page folder
while IFS=$'\t' read -r dir name url hash ext; do
  [ -s "$STORE/$hash.$ext" ] || continue
  ln -sfn "$(rel "$STORE/$hash.$ext" "$BASE/$dir")" "$BASE/$dir/$name"
done < "$TMP/dl.tsv"
newn=$(wc -l < "$TMP/new.txt" | tr -d ' ')
echo "  creatives: $newn new downloaded, $had already in store"

# ── 2. transcribe + OCR only what has no result yet ──────────────────────────
tn=0
while IFS= read -r V; do
  hash="$(basename "$V")"; hash="${hash%.*}"
  # -f not -s: an EMPTY transcript is a valid result (some ads carry no audio
  # stream at all), so the attempt itself is what we record. Testing -s would
  # re-run whisper on every silent video every single week, forever.
  if [ ! -f "$TX/$hash.txt" ] && [ -f "$MODEL" ]; then
    ffmpeg -v error -y -i "$V" -t 90 -ar 16000 -ac 1 -c:a pcm_s16le "$TMP/a.wav" 2>/dev/null &&
      whisper-cli -m "$MODEL" -f "$TMP/a.wav" -nt -np -l en --output-txt -of "$TX/$hash" >/dev/null 2>&1
    [ -f "$TX/$hash.txt" ] || : > "$TX/$hash.txt"      # silent video: record the attempt
    tn=$((tn+1))
  fi
  if [ ! -f "$OC/$hash.txt" ]; then
    : > "$OC/$hash.txt"
    for T in 0.5 1.5 3; do
      F="$FR/$hash-t$T.jpg"
      [ -s "$F" ] || ffmpeg -v error -y -ss "$T" -i "$V" -frames:v 1 -vf "scale=720:-1" "$F" 2>/dev/null
      [ -s "$F" ] || continue
      ffmpeg -v error -y -i "$F" -vf "scale=1440:-1,format=gray,eq=contrast=1.25" "$TMP/p.png" 2>/dev/null
      tesseract "$TMP/p.png" stdout --psm 11 2>/dev/null >> "$OC/$hash.txt"
    done
  fi
done < <(find "$STORE" -name "*.mp4" -size +20k)
silent=$(find "$TX" -name "*.txt" -empty 2>/dev/null | wc -l | tr -d ' ')
echo "  transcribed $tn new video(s); store holds $(ls "$TX" 2>/dev/null | wc -l | tr -d ' ') transcripts ($silent silent/no-audio)"

# ── 3. index + what was new this run ────────────────────────────────────────
node -e '
const fs=require("fs"),path=require("path");
const [store,run,date,newfile]=process.argv.slice(1);
const idx=(()=>{try{return JSON.parse(fs.readFileSync(path.join(store,"index.json"),"utf8"));}catch{return{};}})();
const m=JSON.parse(fs.readFileSync(path.join(run,"creatives-manifest.json"),"utf8"));
const fresh=new Set(fs.existsSync(newfile)?fs.readFileSync(newfile,"utf8").split("\n").filter(Boolean):[]);
const newHashes=[];
for(const c of m){
  const ext=c.file.split(".").pop(), f=path.join(store,c.hash+"."+ext);
  if(!fs.existsSync(f)) continue;
  const e=idx[c.hash]||{hash:c.hash,ext,first_seen:date,runs:[],ad_ids:[],pages:[]};
  e.bytes=fs.statSync(f).size; e.kind=c.kind;
  if(!e.runs.includes(date)) e.runs.push(date);
  if(!e.ad_ids.includes(c.id)) e.ad_ids.push(c.id);
  if(!e.pages.includes(c.page)) e.pages.push(c.page);
  e.last_seen=date;
  if(e.first_seen===date && fresh.has(c.hash+"."+ext)) newHashes.push(c.hash);
  idx[c.hash]=e;
}
fs.writeFileSync(path.join(store,"index.json"),JSON.stringify(idx,null,2));
fs.writeFileSync(path.join(run,"creatives-new.json"),JSON.stringify(
  m.filter(c=>newHashes.includes(c.hash)).map(c=>({hash:c.hash,id:c.id,page:c.page,bucket:c.bucket,
    kind:c.kind,copy_hook:c.copy_hook.slice(0,160),link:c.link})),null,2));
const all=Object.values(idx);
console.log(JSON.stringify({store_total:all.length,
  bytes:+(all.reduce((s,e)=>s+(e.bytes||0),0)/1048576).toFixed(0)+"MB",
  first_seen_this_run:all.filter(e=>e.first_seen===date).length,
  carried_over:all.filter(e=>e.first_seen!==date&&e.runs.includes(date)).length,
  newly_downloaded:newHashes.length}));
' "$STORE" "$RUN" "$DATE" "$TMP/new.txt"

# per-run pointers so the run folder still resolves transcripts/ocr/frames
ln -sfn "$(rel "$TX" "$RUN")" "$RUN/transcripts" 2>/dev/null
ln -sfn "$(rel "$OC" "$RUN")" "$RUN/ocr" 2>/dev/null
ln -sfn "$(rel "$FR" "$RUN")" "$RUN/frames" 2>/dev/null
