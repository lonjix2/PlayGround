#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Validate inputs early: missing URL/DIR is a script defect (exit 1).
if [[ -z "${CAPTURE_URL:-}" ]]; then echo "Set CAPTURE_URL." >&2; exit 1; fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then echo "Set CAPTURE_DIR." >&2; exit 1; fi
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p bash -c 'test -n "$0" && test -n "$1"' "$CAPTURE_URL" "$CAPTURE_DIR"
HELPER="${RUNNER_TEMP:-/tmp}/scripture-city-capture.cjs"
/usr/bin/time -p tee "$HELPER" >/dev/null <<'NODEJS'
const { readFileSync, mkdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const runtime = join(process.env.HOME || '/home/runner', '.local/share/omgithub-playwright');
const { chromium } = require(join(runtime, 'node_modules/playwright'));
const config = JSON.parse(readFileSync(join(runtime, 'linux.json'), 'utf8'));
if (process.platform === 'linux') {
  try { process.env.DISPLAY = ':' + readFileSync(join(runtime, 'display'), 'utf8').trim(); } catch {}
}
const url = process.env.CAPTURE_URL, output = process.env.CAPTURE_DIR;
if (!url || !output) { console.error('Set CAPTURE_URL and CAPTURE_DIR.'); process.exit(1); }
mkdirSync(output, { recursive: true });
const transient = (msg, err) => { console.error('TRANSIENT:', msg, err?.message || err || ''); process.exit(75); };
const defect = (msg) => { console.error('DEFECT:', msg); process.exit(1); };
(async () => {
let browser;
try {
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }); }
  catch (e) { transient('browser launch failed', e); }
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    let page;
    try { page = await browser.newPage({ viewport: { width, height } }); }
    catch (e) { transient(`newPage failed (${name})`, e); }
    page.setDefaultTimeout(30000);
    page.on('pageerror', (e) => console.error('pageerror:', e?.message));
    let response;
    try { response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }); }
    catch (e) { transient(`navigation failed (${name})`, e); }
    const status = response?.status();
    if (!response || !response.ok()) {
      if (!status || [408, 429, 500, 502, 503, 504].includes(status)) transient(`HTTP ${status} loading preview (${name})`, new Error('retryable http'));
      else defect(`HTTP ${status} loading preview (${name})`);
    }
    try {
      await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForFunction(() => document.fonts ? document.fonts.status === 'loaded' : true, null, { timeout: 15000 });
      await page.locator('#app, main, body').first().waitFor({ state: 'visible', timeout: 15000 });
    } catch (e) { defect(`rendered content never became visible (${name}): ${e?.message}`); }
    // Rendering-defect guard: expected marker text must be present.
    const marker = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 4000) : '');
    if (!/SCRIPTURE CITY/i.test(marker)) defect(`expected app content missing (${name})`);
    await page.waitForTimeout(1200);
    const dest = join(output, `final-${name}.png`);
    try { await page.screenshot({ path: dest, timeout: 30000 }); }
    catch (e) {
      if (e?.name === 'TimeoutError' || (browser && !browser.isConnected())) transient(`screenshot timeout (${name})`, e);
      defect(`screenshot failed (${name}): ${e?.message}`);
    }
    try {
      const size = statSync(dest).size;
      if (size < 15000) defect(`screenshot too small (${name}, ${size} bytes) — blank render?`);
    } catch (e) { defect(`screenshot missing (${name}): ${e?.message}`); }
    console.log(`Capture ${name}: ok -> ${dest}`);
    await page.close().catch(() => {});
  }
} catch (e) {
  if (e && (e.message || '').startsWith('TRANSIENT') || process.exitCode === 75) { console.error(e); process.exit(75); }
  console.error(e);
  process.exit(process.exitCode || 1);
} finally {
  try { if (browser) await browser.close(); } catch (e) { console.error(e); process.exitCode = process.exitCode || 75; }
}
})();
NODEJS
/usr/bin/time -p node --check "$HELPER" || { echo "Capture helper has a syntax defect." >&2; exit 1; }
/usr/bin/time -p node "$HELPER"
STATUS=$?
/usr/bin/time -p ls -la "$CAPTURE_DIR"
exit $STATUS
