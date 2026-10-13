#!/bin/sh
# Copy the built site (wasm/out) to ../docs for GitHub Pages, with a cache-busting build id.
set -e
cd "$(dirname "$0")"
B=$(date +%Y%m%d%H%M%S)
sed "s#{{{ SCRIPT }}}#<script async type=\"text/javascript\" src=\"index.js?v=$B\"></script>#; s#src=\"index.js\"#src=\"index.js?v=$B\"#; s#__BUILD__#$B#g" out/index.html > ../docs/index.html
cp out/index.js out/index.wasm out/loader.js ../docs/
echo "published build $B"
