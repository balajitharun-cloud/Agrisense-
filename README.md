# AgriSense — Field intelligence, in real time

A farm-intelligence platform for Indian farmers: live sensor telemetry, weather, satellite soil
indices, region-aware crop advice, plant-protection guidance, a marketplace, government
advisories and voice output — in one editorial interface, in 10 Indian languages, light and dark.

Runs with **zero API keys** (simulated, realistic data) and upgrades to live integrations when
keys are supplied.

## Stack

- Frontend — React 18 + Vite 5, react-router-dom 6, Recharts, lucide-react, plain CSS tokens.
- Backend — Node 18+ / Express 4 (ES modules), cors, dotenv, undici (proxy-aware fetch).
  No database: in-memory data and services.

## Quick start

```bash
# backend (API on :8787)
cd backend && npm install && npm start

# frontend (dev server on :5173, proxies /api and /health to :8787)
cd frontend && npm install && npm run dev

# full app on :8787 (build once first)
cd frontend && npm run build && cd ../backend && npm start
# → http://localhost:8787  (deep links like /sensors work)
```

Health: `GET /health` → `{ "status": "ok", "uptime": ... }` · API: `GET /api/meta`.

Smoke test (boots the app on an ephemeral port, checks every route register + auth):

```bash
cd backend && npm run smoke
```

Frontend render check (SSR-renders all 9 routes with esbuild to catch runtime errors):

```bash
cd frontend && npm run check:render
```

## Demo account

`demo@agrisense.in` / `demo1234` (or the “Use demo account” button on the login form).

> **Not durable.** Accounts live in an in-memory Map and tokens are opaque bearer strings with
> 24-hour expiry. Replace with a real database for any production use.

## Layout

```
backend/   src/server.js (port) · src/api.js (createApiApp) · src/routes · src/services · src/data · scripts/smoke.mjs
frontend/  src/pages (9 routes) · src/components · src/context · src/i18n/strings.js · src/styles/global.css
api/       index.js — Vercel serverless entry re-exporting the same app
```

Hosts from one app definition: `createApiApp({ serveFrontend, logging })` in
`backend/src/api.js` is used by both `backend/src/server.js` (long-running, serves `frontend/dist`)
and `api/index.js` (serverless).

## Languages

English, हिन्दी, ಕನ್ನಡ, தமிழ், తెలుగు, മലയാളം, मराठी, বাংলা, ગુજરાતી, ਪੰਜਾਬੀ — defined once in
[`frontend/src/i18n/strings.js`](frontend/src/i18n/strings.js). English is the source of truth;
missing keys fall back to English, a raw key never reaches the screen. The choice persists and
drives `Intl` number/date formatting. Agronomy-critical dynamic text is translated server-side
(`POST /api/translate`).

## Integrations (all optional)

| Feature | Default (no keys) | With keys |
| --- | --- | --- |
| Weather | Open-Meteo (no key) → simulated fallback if network fails | `OPENWEATHER_API_KEY` |
| Satellite soil | Seeded district simulation | `SENTINEL_HUB_CLIENT_ID` / `..._SECRET` |
| Voice | Browser Web Speech API | `ELEVENLABS_API_KEY` (+ voice/model) — key stays server-side |
| Translation | Curated phrase dictionary | `TRANSLATE_API_KEY` |
| Marketplace / Gov feed | In-memory demo data | `MARKETPLACE_API_BASE` + key / `GOV_FEED_URL` |

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` for a commented reference —
the app also runs with an empty environment. **Never commit `.env`.**

## Data honesty

Every data response carries `source: "live" | "simulated" | "mock"` and the UI renders it as a
badge. Failed integrations degrade to simulated data with a visible label — a page never blanks.
Sensor telemetry is a diurnal simulation (temperature/humidity sine curve on local time, soil
moisture decays with simulated rainfall, NPK drifts slowly). Sensible defaults: Karnataka with
real districts and agro-climatic zones, 10 pests / 10 pesticide products with real active
ingredients, 14 input listings, 10 mandi commodities, 10 advisories. The pesticide panel carries a
persistent disclaimer: **verify dosages against the current CIB&RC label and a licensed
agronomist before use.**

## Deployment

- **GitHub Pages** — `.github/workflows/pages.yml` re-runs the real backend on an ephemeral
  port, snapshots every `GET` endpoint the UI can reach (504 JSON files across all districts,
  seasons and water levels) into static assets, and publishes the SPA at
  `https://balajitharun-cloud.github.io/Agrisense-/`. The client (`src/lib/staticApi.js`)
  serves those snapshots when no live server answers, and filters listings/announcements
  locally, so the published site is fully browsable with `simulated` badges. Accounts, voice
  TTS and live translation need the server build. SPA deep links work via a `404.html` copy.
- **Docker** — multi-stage `Dockerfile`: builds the frontend, runs Express serving `dist` on 8787.
- **Vercel** — `vercel.json` (framework `vite`, static `frontend/dist`, `/api` + `/health` to the
  function, everything else to `index.html` for SPA deep links).
- **CI** — `.github/workflows/ci.yml` runs the smoke test, render check and build; `deploy.yml`
  publishes a GHCR image on `main`.
