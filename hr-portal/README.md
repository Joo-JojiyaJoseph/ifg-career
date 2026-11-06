# Infolks Group HR portal

The private recruitment portal: a standalone React + Vite app in plain JavaScript.
It runs on port 5174 and builds to `dist/`. Its partner app, the careers site, lives in `../career-site`. Both use the API in `../career-backend`.

## Run it

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8000, VITE_CAREERS_URL=http://localhost:5173
npm install
npm run dev              # http://localhost:5174/login
```

The other scripts are `build`, `preview`, `lint`, `test`, `e2e` and `e2e:report`.

### Using Laravel Herd, Valet or Laragon

If the API has its own local domain (for example `http://career-backend.test`), the browser treats it as a different site from `localhost`, and sign-in fails with "CSRF token mismatch".
Set `VITE_API_PROXY=http://career-backend.test` in `.env` and restart `npm run dev`.
The dev server then forwards `/api`, `/sanctum` and `/storage`, and the cookies work. Keep `SESSION_DOMAIN=null` in `career-backend/.env`.

## Structure

- `src/main.jsx`, `App.jsx`, `routes.jsx`: the entry point and routes.
- `src/pages`, `src/features`, `src/layouts`: the dashboard, jobs, candidates, applications, interviews, talent community, Website Content, reports, notifications, settings and audit log.
- `src/shared`: buttons, forms, tables, charts, glass styles, logos (`shared/brand`), illustrations and the API client (alias `@shared`).
  The careers site has its own copy. Files that exist in both apps must stay identical, and CI checks this.

## Sign in

HR signs in at `/login` with the seeded accounts (see the backend README).
Email and password are enough: no authenticator code is asked for. To require one again, set `HR_REQUIRE_TWO_FACTOR=true` in `career-backend/.env`. Admin then confirms an authenticator app on the next sign-in, and HR users who have set one up are asked for their code.

`Ctrl+K` opens search from anywhere. The notification bell checks for new notifications every 30 seconds while the tab is visible.
Those background checks don't keep an idle session alive.

## Heavy pieces load on demand

Recharts (dashboard chart) and TipTap (rich text editor) are split into their own chunks and load only on the pages that use them.
Sparklines and the donut chart are plain SVG.

## End-to-end tests

`e2e/` covers the HR interview flow (shortlist → schedule → pass → Selected), Ctrl+K search, sending a company update and editing an FAQ.
Start the API on fresh seed data, run `npm run dev`, then:

```bash
npx playwright install chromium   # first time only
npm run e2e                       # E2E_PORTAL_URL overrides http://localhost:5174
```
