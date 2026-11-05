# Infolks Group careers frontend

One Vite project, two apps, plain JavaScript:

- Careers site: `careers.html` → `src/careers`, port 5173, build output `dist/careers`
- HR portal: `portal.html` → `src/portal`, port 5174, build output `dist/portal`

Shared UI, the API client and Zod schemas live in `src/shared`. The apps do not import each other.

## Scripts

```bash
npm install
npm run dev
```

`dev` starts both apps. `dev:careers` and `dev:portal` start one. `build`, `build:careers` and `build:portal` write static files. Also: `lint`, `test`, `preview:careers`, `preview:portal`.

The API is `http://localhost:8000` (`VITE_API_URL`). Copy `.env.example` to `.env`.

## Auth

Candidates use Google. The Sign in button sends the browser to `VITE_GOOGLE_LOGIN_URL`. Without Google credentials the API returns the visitor to the careers site with `auth_error=google_not_configured`.

HR signs in at `http://localhost:5174/login` with the seeded accounts (see the backend README). Admin must confirm an authenticator app before the session starts. HR can sign in with a password and turn on two-factor later.

## Design

Tailwind v3. Tokens are in `src/shared/ui/tailwind.preset.js`. Icons are Heroicons. Photographs in `src/careers/assets/images` and `src/portal/assets/images` are SVG placeholders; see `CREDITS.md`.
