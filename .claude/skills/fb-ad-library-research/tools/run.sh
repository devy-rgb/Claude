#!/usr/bin/env bash
# Full analysis pass over an already-harvested run.
#   ./run.sh <niche> <YYYY-MM-DD> [--media]
# Harvest happens in the browser first (references/harvest-protocol.md).
# --media additionally downloads creatives, transcribes video and OCRs the
# hook frames; skip it for a copy-only pass.
set -euo pipefail
NICHE="${1:-roofing}"; DATE="${2:-$(date +%F)}"; MEDIA="${3:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
run() { echo "→ $1"; node "$DIR/$1.mjs" --niche "$NICHE" --date "$DATE" | tail -n 20; }

run analyze
run angles
run manifest
# keep media/transcripts joined if the creative-id scheme changed (no downloads), then rebuild scripts.json
run store-alias
run scripts
run calls
if [ "$MEDIA" = "--media" ]; then
  echo "→ media (download + transcribe + ocr)"
  bash "$DIR/media.sh" "$NICHE" "$DATE"
  run scripts
fi
run score
run queue
run writeups
run hookfiles
run top
# landing pathways: redirects, tracker, cloaking, offer mismatch for the top ads.
# Same day as the harvest — tracker links and funnels rotate.
run redirects
run pdf
echo "✅ $NICHE $DATE — ~/Documents/AdLibraryResearch/fb-ad-library/$NICHE/_reports/$DATE/"
