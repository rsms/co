#!/bin/bash -e
cd "$(dirname "$0")/../.."

./build.js -O -lib -o docs/play/co.js
