#!/bin/sh
set -e
cd "$(dirname "$0")"

jekyll serve --limit_posts 20 --watch --host 0.0.0.0 --port 3001 --open-url
