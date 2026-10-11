#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-3000}"
/usr/bin/time -p bash -c 'test "${0}" -ge 1' "$PORT"
PROJECT_ROOT="$(pwd)"
/usr/bin/time -p pwd >/dev/null
STATIC_DIR="$PROJECT_ROOT/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
# Fail fast (exit 1) when the built output is missing.
/usr/bin/time -p test -f "$STATIC_DIR/index.html" || { echo "Static deployment output must contain dist/index.html." >&2; exit 1; }
# Install dependencies and build only when the project needs it.
if /usr/bin/time -p test -f "$PROJECT_ROOT/package.json"; then
  if /usr/bin/time -p test -f "$PROJECT_ROOT/package-lock.json"; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p npm run --silent build --if-present; then
    /usr/bin/time -p test -f "$STATIC_DIR/index.html" || { echo "Build did not produce dist/index.html." >&2; exit 1; }
  fi
fi
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p python3 -c 'import json,os; web=os.environ.get("OPENCODE_WEB_DIR","/home/runner/work/_temp/omgithub-web"); root=os.getcwd(); open(os.path.join(web,"deployment-output.json"),"w").write(json.dumps({"project":root,"directory":os.path.join(root,"dist")}))'
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
echo "Serving $STATIC_DIR on port $PORT (foreground)."
exec /usr/bin/time -p python3 -m http.server "$PORT" --directory "$STATIC_DIR"
