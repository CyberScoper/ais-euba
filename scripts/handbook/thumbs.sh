#!/bin/bash
# Full-size originals -> the 240px square thumbnails the handbook cards wear.
# Originals: /mnt/extra/ais-photos/uni/<id>.png (kept out of the repo, they are ~1.2 MB each)
set -euo pipefail
SRC="${SRC:-/mnt/extra/ais-photos/uni}"
OUT="$(cd "$(dirname "$0")/../../public/photos/uni" && pwd)"
for f in "$SRC"/*.png; do
  id="$(basename "$f" .png)"
  convert "$f" -strip -resize '240x240^' -gravity center -extent 240x240 -quality 78 "$OUT/$id.webp"
  printf '%s %s bytes\n' "$id" "$(stat -c%s "$OUT/$id.webp")"
done
