#!/bin/bash
set -o errexit -o pipefail -e
cd "$(dirname "$0")/.."

# svg
for f in _includes/icons/*.svg r/*.svg doc/r/*.svg; do
  echo "svgo $f"
  svgo --config='{"plugins":[{"transformsWithOnePath":{}},{"removeViewBox":{}},{"removeAttrs":{"attrs":["figma.+"]}},{"removeTitle":{}},{"removeDesc":{"removeAny":true}}]}' \
       --multipass \
       -q \
       "$f" &
done

pushd r >/dev/null
for f in *.ico; do
  echo "pngcrush $f"
  TMPNAME=.$f.tmp
  (pngcrush -q "$f" "$TMPNAME" && mv -f "$TMPNAME" "$f") &
done
popd

wait
