#!/bin/sh -e
cd "$(dirname "$0")"

jekyll serve \
  --incremental \
  --limit_posts 20 \
  --watch \
  --host localhost \
  --port 3001 \
  --livereload \
  --livereload-port 3963 \
  --open-url
