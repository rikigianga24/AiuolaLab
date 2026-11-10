# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AiuolaLab is an Italian-language web app and PWA for designing flower beds, balconies and vegetable gardens. It covers to-scale drawing, a plant catalog, an AI advisor, drip irrigation, a care calendar, weather alerts, accounts and push/email notifications.

All UI text, code comments, log messages and commit messages are in **Italian**. Keep it that way.

The owner is non-technical and works only through GitHub and Render, with nothing installed locally.
- Production is Render (free tier), which auto-deploys `master`.
- The database is Postgres on Supabase.
- Explanations to the owner should be in plain Italian, without assuming a local dev setup.

## Commands

```bash
npm run dev          # Vite (5173) + Express API (3001) together; Vite proxies /api to 3001
npm run dev:web      # frontend only
npm run dev:api      # API only (node --watch)
npm run build        # vite build -> dist/ (served by Express in production)
npm start            # production server (serves dist/ + /api)
npm run lint         # eslint over the whole repo (src, server, test, public)
npm test             # node --test test/*.test.js
node --test test/care.test.js                       # a single test file
node --test --test-name-pattern="notifiche" test/   # tests matching a name
```

- `test/server.test.js` holds the API/scheduler integration tests. They run only when `TEST_DATABASE_URL` points at a real Postgres; otherwise they are skipped:
  ```bash
  TEST_DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm test
  ```
- Useful env for local runs:
  - `SCHEDULER=off` stops the notification scheduler.
  - `PHOTO_WARMUP=off` skips pre-fetching plant photo links at startup.
  - `.env.example` documents every variable; all of them are optional and features switch off when unset.

## Architecture

**One Express server serves both** the API (`/api/*`) and the built SPA from `dist/` (`server/app.js`).
- `createApp()` is separate from `server/index.js`, which does the startup work: `initDatabase` → `initPush` → listen → scheduler and photo warmup. This split lets tests mount the app on port 0.
- Every `/api` route passes through `sameOrigin` (an Origin-based CSRF check) and `sessionMiddleware` (cookie session → `req.user`).

**Graceful degradation.** Features are enabled by configuration, and `GET /api/health` reports what is on: `database`, `ai`, `mail`, `push`, `vapidPublicKey`. The client reads this in `src/lib/session.jsx` as `features`.
- Without `DATABASE_URL`, projects live only in `localStorage` and there are no accounts.
- `server/schema.sql` is idempotent and runs on every startup. It holds the tables, enables RLS (Supabase exposes `public` over REST; the server connects as table owner), and does periodic cleanup. Add new tables there and enable RLS for them too.

**Projects and ownership** (`src/lib/projects.js`, `server/routes/projects.js`).
- There is one open project per environment: `garden`, `balcony`, `vegetable`. Each is saved to localStorage on every change and synced to the server when one is available.
- Anonymous users are identified by a random device key sent as `X-Owner-Key`. After login, those projects are re-owned to `user:<id>`.
- A project is a JSON blob (`data` JSONB) with `beds[]`, and each bed has `points` (in metres) and `plants[]`.

**User settings.**
- Settings are one JSONB column on `users`: climate, location, `notify{…}`, `taskState`, pets and so on.
- The client merges partial patches through `updateSettings`, which debounces `PUT /api/account/settings`. That endpoint validates with a partial zod schema and merges server-side.
- When you add a setting, update **both** `DEFAULT_SETTINGS` objects: the one in `src/lib/session.jsx` and the one in `server/routes/account.js` (including its zod schema).
- `taskState` maps a task id to `{done | snoozedUntil}`. On login, server entries win.

**Domain logic is shared, pure ES modules in `src/lib/`.** The server imports several of them directly. For example, `server/scheduler.js` uses `src/lib/care.js` to generate the same calendar tasks the UI shows. Keep these modules free of browser-only APIs when the server uses them. Main modules:
- `care.js`: calendar tasks;
- `irrigation.js`: drip routing and schedules;
- `growth.js` and `forecast.js`: rule-based 1/3/5-year forecast, with no AI;
- `gardenStyles.js`: garden style categories and plant matching;
- `layout.js` and `rows.js`: placement and vegetable rows;
- `crops.js`: vegetables, rotations and companions.

**Plants** (`server/plants/`).
- `service.js` picks a provider: the internal catalog by default, or Perenual via `PLANT_PROVIDER=perenual`.
- The catalog is `server/plants/catalog/*.js`, one line per plant. The line format is documented in `catalog/index.js`.
- `normalize.js` (`matchesFilters`) is the shared filter logic.
- Photos come from iNaturalist with a Wikimedia fallback (`photos.js`, `wikimedia.js`). Links are cached in `plant_cache` and warmed with a priority queue at startup.

**Canvas** (`src/components/garden/`).
- `GardenStage.jsx` is react-konva 10.
- Touch input is handled with native pointer events: pinch zoom, tap deduplication, `Konva.dragDistance`, and larger hit targets on coarse pointers. Konva's own gesture handling was not reliable here, so don't replace this with Konva gesture APIs.
- Plant icons are drawn procedurally into cached canvases (`src/lib/plantIcons.js`). Several art styles are selected through `artStyle.js`; the "tempera" style lives in `tempera.js` and `temperaGround.js`.

**AI advisor.** `server/ai/advisor.js` and `routes/suggest.js` use the Anthropic SDK and are enabled only by `ANTHROPIC_API_KEY`. They are rate-limited.

**Notifications** (`server/notify.js`, `server/scheduler.js`, `server/pushMessages.js`, `public/push-sw.js`).
- The scheduler runs every 10 minutes in Europe/Rome time. It deduplicates through `notification_log` (`alreadySent(userId, key)`, with keys such as `daily:<date>`, `task:<id>`, `alert:<id>`, `week:<isoWeek>`).
- Push sends **at most one notification per user per day**, built by `dailyMessage()`.
- Email goes through the Brevo HTTP API (`BREVO_API_KEY`). SMTP is only a fallback, because Render's free tier blocks SMTP ports.
- VAPID keys come from env if set. Otherwise they are generated once and stored in `app_settings` (key `vapid`). They must never change, or every subscribed device stops receiving notifications.
- `public/push-sw.js` is pulled into the Workbox service worker through `importScripts` (`vite.config.js`). Its "Fatto/Rimanda" action buttons call `POST /api/account/task-state`.
- The service worker exists only in a production build, not under `vite` dev.

**Frontend.**
- React 19, react-router 7 (routes in `src/App.jsx`), Bulma plus custom CSS in `src/styles/` and `src/App.css`.
- The visual language is cream/sage/terracotta, using CSS variables such as `--ink`, `--sage`, `--terracotta` and `--paper`.
- Legal texts (privacy, cookies) are in `src/lib/legal.js`. Cookie and external-content consent is in `src/lib/consent.js`.

## Conventions

- Develop on the assigned feature branch, then merge to `master` only when the owner approves. Merging deploys to production.
- Never commit `.env`. Avoid realistic-looking credential strings in examples and tests, because GitGuardian scans the repo. Tests generate passwords at runtime for this reason.
- Verify UI changes in a real browser (Playwright) at desktop and phone sizes. Touch behaviour on phones has regressed before.
