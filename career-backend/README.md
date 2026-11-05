# Infolks Group Careers API

Laravel API for the public careers site and the HR portal. PHP 8.3, MySQL 8. No Docker.

## Local setup

Install PHP 8.3 (pdo_mysql, mbstring, intl, gd or imagick, zip, bcmath, fileinfo, openssl), Composer 2, and MySQL 8. Any of these hosts work:

- **Laravel Herd:** point a site at `career-backend/public`, or ignore Herd and use `composer run dev`.
- **Laragon or XAMPP:** start MySQL, then use `composer run dev` so PHP is the one on your PATH.
- **Native PHP + MySQL:** same commands. Create the database first: `CREATE DATABASE \`ifg-career\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

```bash
composer run setup
composer run dev
```

`setup` installs dependencies, copies `.env.example` when `.env` is missing, generates `APP_KEY` only when it is empty, links `public/storage`, and runs `migrate --seed`. `dev` starts the API on port 8000, a queue listener, and the scheduler.

Cache, queue and session use the database. Redis is optional: set `REDIS_*` and switch `CACHE_STORE`, `QUEUE_CONNECTION` and `SESSION_DRIVER` to `redis`. No code change is required.

## Seeded accounts

Printed again each time the seeders run:

- Admin: `admin@infolksgroup.com` / `InfolksGroup#2026` (authenticator required on first sign-in)
- HR: `hr@infolksgroup.com` / `InfolksGroup#2026`

## Environment

See `.env.example`. The values that matter locally:

- `DB_*` for MySQL
- `SESSION_DOMAIN=localhost` and `SANCTUM_STATEFUL_DOMAINS` covering ports 5173 and 5174
- `FRONTEND_CAREERS_URL` and `FRONTEND_PORTAL_URL`
- `MAIL_MAILER=log` writes mail to `storage/logs`. For Mailtrap, set `MAIL_MAILER=smtp` and the Mailtrap host, port, username and password.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (`http://localhost:8000/api/v1/auth/google/callback`) and `GOOGLE_CALENDAR_ID`

In Google Cloud, create an OAuth client (web) and add the redirect URI above. The consent screen needs the `email` and `profile` scopes. Calendar sync is queued; a real calendar client is a later phase. Until `GOOGLE_CALENDAR_ID` is set, interview rows are marked with a failed sync status.

Production cookies need `SESSION_DOMAIN=.infolksgroup.com` and `SESSION_SECURE_COOKIE=true`. See `docs/DEPLOYMENT.md`.

## Mail, queues, scheduler

Emails, exports and calendar sync are queued. `composer run dev` already runs `queue:listen`. In production, Supervisor runs `php artisan queue:work` and cron runs `* * * * * php artisan schedule:run`.

Scheduled now: `jobs:auto-close` daily, and `blocks:lift-expired` hourly (expired blocks are inactive via the `active` scope; the command reports how many have lapsed). Interview reminders and the daily digest are later phases.

SPF, DKIM and DMARC belong on the domain that sends `careers@infolksgroup.com`.

## Adding a company, department or team

Entities, departments and teams are rows, not code.

- Entity: name, slug, theme colours. The four seeded companies are Infolks, Webfolks, Dataways and Medrays.
- Department: name and slug. Teams optionally belong to a department.
- Re-running `php artisan db:seed` updates existing rows and does not duplicate them.

Website copy (about blocks, FAQs, interview steps, stories, drives, recognitions, media) is seeded and edited later from the portal content screens. Until those screens exist, update the tables or `WebsiteContentSeeder` and seed again.

## Tests

```bash
php artisan test
```

Feature tests use sqlite in memory. The app database stays MySQL.
