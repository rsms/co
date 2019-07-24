#!/bin/bash -e
cd "$(dirname "$0")"
../../misc/gen.js \
  ../ir/ops.ts \
  ../ir/arch.ts \
  ../ir/rewrite_"*" \
  "${@}"
