#!/bin/bash
# brand/*.svg -> the icon files the app and the browsers ask for.
# Run after editing any of the three sources; nothing else generates these.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/icons
mkdir -p "$OUT"

rsvg-convert -w 192 -h 192 brand/icon.svg          -o "$OUT/icon-192.png"
rsvg-convert -w 512 -h 512 brand/icon.svg          -o "$OUT/icon-512.png"
rsvg-convert -w 512 -h 512 brand/icon-maskable.svg -o "$OUT/icon-maskable.png"
# iOS applies its own mask and never rounds what it is given, so it gets the square one.
rsvg-convert -w 180 -h 180 brand/icon-maskable.svg -o "$OUT/apple-touch-icon.png"

cp brand/favicon.svg public/favicon.svg
# A .ico for the browsers that still ask for one by name, three sizes in one file.
for s in 16 32 48; do rsvg-convert -w $s -h $s brand/favicon.svg -o "/tmp/favicon-$s.png"; done
convert /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png public/favicon.ico
rm -f /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png

for f in "$OUT"/*.png public/favicon.svg public/favicon.ico; do
  printf '%s %s bytes\n' "$f" "$(stat -c%s "$f")"
done
