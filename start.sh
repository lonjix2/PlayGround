#!/usr/bin/env bash
# ARMOR OF GOD — project start script.
# Builds (when needed) and serves the Vite static output in the foreground.
# Writes worker metadata (deployment-output.json) under OPENCODE_WEB_DIR only;
# source and built output stay inside PROJECT_DIR.
set -euo pipefail
cd "$(dirname "$0")"
time -p bash -n start.sh
PROJECT_ROOT="$(pwd)"
APP_DIR="$PROJECT_ROOT/armor-of-god"
DIST_DIR="$APP_DIR/dist"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PORT DIST_DIR WEB_DIR PROJECT_ROOT
/usr/bin/time -p test -d "$APP_DIR"
/usr/bin/time -p test -f "$APP_DIR/package.json"
/usr/bin/time -p mkdir -p "$WEB_DIR"
# Install dependencies when node_modules is missing or vite is absent.
NEED_INSTALL=0
/usr/bin/time -p test -d "$APP_DIR/node_modules" || NEED_INSTALL=1
/usr/bin/time -p test -x "$APP_DIR/node_modules/.bin/vite" || NEED_INSTALL=1
if [ "$NEED_INSTALL" = "1" ]; then
  if /usr/bin/time -p test -f "$APP_DIR/package-lock.json"; then
    /usr/bin/time -p npm ci --prefix "$APP_DIR" --no-audit --no-fund
  else
    /usr/bin/time -p npm install --prefix "$APP_DIR" --no-audit --no-fund
  fi
fi
# Build when dist is missing or any source file is newer than dist/index.html.
NEED_BUILD=0
/usr/bin/time -p test -f "$DIST_DIR/index.html" || NEED_BUILD=1
if [ "$NEED_BUILD" = "0" ] && /usr/bin/time -p test -n "$(find "$APP_DIR/src" "$APP_DIR/index.html" "$APP_DIR/package.json" -newer "$DIST_DIR/index.html" -print -quit 2>/dev/null)"; then
  NEED_BUILD=1
fi
if [ "$NEED_BUILD" = "1" ]; then
  /usr/bin/time -p npm run --prefix "$APP_DIR" build
fi
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p node -e 'const{writeFileSync}=require("node:fs");const{join}=require("node:path");writeFileSync(join(process.env.WEB_DIR, "deployment-output.json"), JSON.stringify({project: process.env.PROJECT_ROOT, directory: process.env.DIST_DIR}));'
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
/usr/bin/time -p echo
# Serve the built static directory in the foreground (SPA fallback to index.html).
/usr/bin/time -p node -e '
const { createServer } = require("node:http");
const { readFileSync, statSync, existsSync } = require("node:fs");
const { resolve, join, extname } = require("node:path");
const root = process.env.DIST_DIR, port = Number(process.env.PORT || 3000);
const mime = { ".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".wasm":"application/wasm", ".glb":"model/gltf-binary" };
createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (path !== resolve(root) && !path.startsWith(resolve(root) + "/")) { res.writeHead(404); res.end(); return; }
    try { if (statSync(path).isDirectory()) path = join(path, "index.html"); }
    catch { if (!extname(path)) path = join(root, "index.html"); }
    if (!existsSync(path) && !extname(path)) path = join(root, "index.html");
    res.setHeader("Content-Type", mime[extname(path)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(readFileSync(path));
  } catch { res.writeHead(404); res.end("Not found"); }
}).listen(port, "0.0.0.0", () => console.log("Serving " + root + " on port " + port));
'
