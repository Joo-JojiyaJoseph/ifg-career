# Infolks Group careers site

The public careers website: a standalone React + Vite app in plain JavaScript.
It runs on port 5173 and builds to `dist/`. Its partner app, the HR portal, lives in `../hr-portal`. Both use the API in `../career-backend`.

## Run it

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8000 and friends
npm install
npm run dev              # http://localhost:5173
```

The other scripts are `build`, `preview`, `lint`, `test`, `e2e` and `e2e:report`.

### Using Laravel Herd, Valet or Laragon

If the API has its own local domain (for example `http://career-backend.test`), the browser treats it as a different site from `localhost`, and sign-in fails with "CSRF token mismatch".
Set `VITE_API_PROXY=http://career-backend.test` in `.env` and restart `npm run dev`.
The dev server then forwards `/api`, `/sanctum` and `/storage`, and the cookies work. Keep `SESSION_DOMAIN=null` in `career-backend/.env`.

## Structure

- `src/main.jsx`, `App.jsx`, `routes.jsx`: the entry point and routes.
- `src/pages`, `src/features`, `src/layouts`: the landing page, job search and detail, apply, candidate profile and applications.
- `src/shared`: buttons, forms, glass styles, logos (`shared/brand`), illustrations and the API client (alias `@shared`).
  The HR portal has its own copy. Files that exist in both apps must stay identical, and CI checks this.
- `public/images/placeholders`: the seeded event, badge and promo images. Replace them by uploading photos in the portal's Website Content.

## Auth

Candidates sign in with Google. The Sign in button sends the browser to `VITE_GOOGLE_LOGIN_URL`.
Without Google credentials, the API returns the visitor with `auth_error=google_not_configured`.

## Design

- Tailwind v3, with tokens in `src/shared/ui/tailwind.preset.js`.
- Heroicons for all icons.
- Glass surfaces (`.glass`, `.glass-dark`) and motion presets live in `src/shared`. All motion stops under "reduce motion".
- Official logos: drop them into `src/shared/brand/` (see the README there).

## End-to-end tests

`e2e/` covers the landing page (desktop and phone), job search and detail, and Quick apply.
Start the API on fresh seed data (`php artisan migrate:fresh --seed && composer run dev` in `career-backend`), run `npm run dev`, then:

```bash
npx playwright install chromium   # first time only
npm run e2e                       # E2E_CAREERS_URL overrides http://localhost:5173
```
