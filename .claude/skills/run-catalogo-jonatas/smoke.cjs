/**
 * Smoke driver for CatalogoJonatas / Ferragem Pro.
 *
 * Usage (from project root):
 *   NODE_PATH=/tmp/pw-smoke/node_modules \
 *   PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
 *   node .claude/skills/run-catalogo-jonatas/smoke.mjs
 *
 * Env vars:
 *   NODE_PATH                              — path to playwright's node_modules parent
 *   PLAYWRIGHT_BROWSERS_PATH              — path to playwright browser cache (required)
 *   PORT                  (default: 3099)  — port the dev server is listening on
 *   SHOTS_DIR             (default: /tmp/shots) — where screenshots land
 *
 * The script does NOT start the dev server. Start it first:
 *   node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3099 &
 */

// CJS syntax so that NODE_PATH is respected for package resolution.
// (ESM `import` resolves relative to the file location and ignores NODE_PATH.)
const { chromium } = require('playwright');
const { mkdirSync } = require('fs');

const PORT  = process.env.PORT      ?? '3099';
const BASE  = `http://localhost:${PORT}`;
const SHOTS = process.env.SHOTS_DIR ?? '/tmp/shots';

mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  async function shot(label, url, waitText) {
    console.log(`nav -> ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    if (waitText) {
      await page.waitForSelector(`text=${waitText}`, { timeout: 10_000 }).catch(() => {});
    } else {
      await page.waitForTimeout(2000);
    }
    const file = `${SHOTS}/${label}.png`;
    await page.screenshot({ path: file });
    console.log(`screenshot -> ${file}`);
  }

  await shot('catalog',     BASE);
  await shot('admin-login', `${BASE}/admin/login`);

  await browser.close();

  if (consoleErrors.length) {
    console.log('\nConsole errors (first 5):');
    consoleErrors.slice(0, 5).forEach(e => console.log(' ', e));
  }
  console.log('\nDone. Screenshots in', SHOTS);
})();
