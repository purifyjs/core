#!/usr/bin/env bash
set -euo pipefail

bundle=$(deno bundle --minify core/mod.ts)

bundle_bytes=$(printf "%s" "$bundle" | wc -c)
gzip_bytes=$(printf "%s" "$bundle" | gzip -c | wc -c)

printf "Bundled size: %d bytes (%.2f KB)\n" "$bundle_bytes" "$(awk "BEGIN{print $bundle_bytes/1024}")"
printf "Gzipped size: %d bytes (%.2f KB)\n" "$gzip_bytes" "$(awk "BEGIN{print $gzip_bytes/1024}")"
