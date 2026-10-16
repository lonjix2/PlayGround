#!/usr/bin/env bash
# Capture desktop + mobile screenshots of the exact CAPTURE_URL into CAPTURE_DIR.
# Browser/output live outside the source tree; the app server is left running.
# Exit 75 = temporary navigation/browser infrastructure failure, 1 = script defect.
set -euo pipefail
cd "$(dirname "$0")"
time -p bash -n capture.sh
/usr/bin/time -p test -n "${CAPTURE_URL:-CAPTURE_URL is required}"
/usr/bin/time -p test -n "${CAPTURE_DIR:-CAPTURE_DIR is required}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
/usr/bin/time -p test -f "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -f "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p ls -la "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
