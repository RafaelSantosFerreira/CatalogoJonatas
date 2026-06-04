---
name: run-catalogo-jonatas
description: Build, run, and drive CatalogoJonatas (Ferragem Pro). Use when asked to start the app, run it, take a screenshot, verify a change visually, or interact with the running catalog or admin pages.
---

Next.js 15 web app (catalog + cart + admin + WhatsApp notifications). Start the dev server, then drive it via the smoke script at `.claude/skills/run-catalogo-jonatas/smoke.cjs` (uses Playwright Chromium headless).

All paths below are relative to the project root (`C:\Projetos\CatalogoJonatas\`).

## Prerequisites

Node.js 20+ with npm available. Playwright browser cache (Chromium) is downloaded on first run to `/tmp/pw-browsers`.

```bash
# Install project dependencies (once after clone)
npm install --legacy-peer-deps

# Install playwright + download Chromium (once, ~120 MB)
mkdir -p /tmp/pw-smoke && echo '{"type":"module","dependencies":{"playwright":"1.60.0"}}' > /tmp/pw-smoke/package.json
cd /tmp/pw-smoke && npm install --silent
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npx playwright install chromium
```

> The project does **not** include playwright as a dependency — it must be installed separately as shown above.

## Setup

Copy `.env.example` → `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
# Edit .env.local — required vars:
#   SUPABASE_API_URL, SUPABASE_ANON_KEY
#   DATABASE_URL, DATABASE_SERVICE_ROLE_KEY
#   SETUP_ADMIN_EMAIL, SETUP_ADMIN_PASSWORD, SETUP_API_TOKEN
```

> Without `.env.local`, the app still starts and renders the shell — catalog shows "Nenhum produto encontrado" and admin login renders normally. All smoke steps pass.

## Run (agent path)

### 1. Start dev server

```bash
# Do NOT use npm run dev (calls a bash wrapper that breaks under Node 24)
# Use the direct binary instead:
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3099 > /tmp/next-dev.log 2>&1 &
echo $! > /tmp/next-dev.pid

# Wait until ready (polls /api/health)
timeout 90 bash -c 'until curl -sf http://localhost:3099/api/health >/dev/null 2>&1; do sleep 2; done' \
  && echo "ready" || echo "timeout — check /tmp/next-dev.log"
```

### 2. Run smoke driver

```bash
NODE_PATH=/tmp/pw-smoke/node_modules \
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers \
node .claude/skills/run-catalogo-jonatas/smoke.cjs
```

Screenshots land in `/tmp/shots/`:
- `catalog.png` — catalog public page
- `admin-login.png` — admin login form

### 3. Verify specific pages manually

```bash
# Health check
curl -s http://localhost:3099/api/health
# → {"status":"ok"}

# Check catalog HTML title
curl -s http://localhost:3099/ | grep -o '<title>[^<]*</title>'
# → <title>Ferragem Pro — Catálogo de Produtos</title>
```

### 4. Stop dev server

```bash
kill $(cat /tmp/next-dev.pid) 2>/dev/null
```

## Run (human path)

```bash
npm run dev   # → opens http://localhost:3000 (or next available port). Ctrl-C to stop.
```

> `npm run dev` calls `bash scripts/run-next-dev.sh` which enables file polling (avoids EMFILE on macOS/Windows). On Node 24 in MSYS2/MinGW, the bash wrapper fails — use the direct `node node_modules/next/dist/bin/next dev` form above instead.

## Test

The project has no automated test suite. Use the smoke driver above + manual flow:
1. Start dev server
2. Run `smoke.cjs`
3. Verify screenshots
4. Test `POST /api/health` and `GET /api/supabase-ping` with curl

## Gotchas

- **`npm run dev` fails with "SyntaxError: missing ) after argument list"** on Node 24 in MSYS2/MinGW. The `.bin/next` shim is a bash script that Node 24 refuses to evaluate. Fix: use `node node_modules/next/dist/bin/next dev ...` directly.

- **Port is not always 3000.** Next.js increments if 3000 is occupied. The smoke script uses port 3099 specifically to avoid conflicts. Always read the "Local" URL printed in the terminal.

- **Catalog shows "Nenhum produto encontrado" without `.env.local`** — this is expected. The app renders the shell; Supabase calls fail gracefully.

- **`playwright` is not in package.json** — do not try `npx playwright` from the project root. Install it in `/tmp/pw-smoke` as shown in Prerequisites and set `NODE_PATH=/tmp/pw-smoke/node_modules`.

- **ESM (`import`) ignores `NODE_PATH`** — the driver is `smoke.cjs` (CommonJS), not `.mjs`, so that `NODE_PATH` works for resolving `require('playwright')`. If you rename it to `.mjs`, it will break with `ReferenceError: require is not defined`.

- **First compilation takes 15–30 s.** The health check `until curl` loop handles this — don't use a fixed `sleep`.

## Troubleshooting

- **`EADDRINUSE :3099`**: Another process holds the port. Kill it: `npx kill-port 3099` or `lsof -ti :3099 | xargs kill -9`.
- **`Executable doesn't exist at ... chrome-headless-shell`**: Browser not downloaded. Run `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npx playwright install chromium` from `/tmp/pw-smoke`.
- **`Supabase público não configurado`** in logs: Missing `.env.local`. The app continues to render; fill `.env.local` for full functionality.
- **`[Supabase Admin] Defina SUPABASE_API_URL + DATABASE_SERVICE_ROLE_KEY`**: Server-side warning when admin env vars are missing — safe to ignore for frontend smoke testing.
