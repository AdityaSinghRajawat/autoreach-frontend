#!/bin/sh
# Writes the browser's runtime settings from the container environment before nginx starts.
set -eu

mkdir -p /tmp/autoreach
escaped=$(printf '%s' "${API_ORIGIN:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__AUTOREACH_CONFIG__ = { apiOrigin: "%s" };\n' "$escaped" > /tmp/autoreach/config.js
