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

- Admin: `admin@infolksgroup.com` / `InfolksGroup#2026`
- HR: `hr@infolksgroup.com` / `InfolksGroup#2026`

## Environment

See `.env.example`. The values that matter locally:

- `DB_*` for MySQL
- `SESSION_DOMAIN=localhost` and `SANCTUM_STATEFUL_DOMAINS` covering ports 5173 and 5174
- `FRONTEND_CAREERS_URL` and `FRONTEND_PORTAL_URL`
- `MAIL_MAILER=log` writes mail to `storage/logs`. For Mailtrap, set `MAIL_MAILER=smtp` and the Mailtrap host, port, username and password.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (`http://localhost:8000/api/v1/auth/google/callback`) and `GOOGLE_CALENDAR_ID`

- `HR_REQUIRE_TWO_FACTOR=false` (default): HR and Admin sign in with email and password only. Set it to `true` to require an authenticator code again; run `php artisan optimize:clear` after changing it.

### Candidate sign-in with Google

1. In [Google Cloud Console](https://console.cloud.google.com/) create or pick a project, then open **APIs & Services → OAuth consent screen**. Choose **External**, fill in the app name (Infolks Group Careers), support email and developer email. Add the scopes `openid`, `email` and `profile`. While the app is in **Testing**, add the Google accounts you will test with under **Test users**.
2. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
   - **Authorised JavaScript origins**: the careers site, e.g. `http://localhost:5173`.
   - **Authorised redirect URIs**: exactly the value of `GOOGLE_REDIRECT_URI` (see below).
3. Copy the client ID and secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then run `php artisan optimize:clear`.

Which redirect URI to use depends on how the careers site reaches the API:

| Setup | `GOOGLE_REDIRECT_URI` | `career-site/.env.local` |
| --- | --- | --- |
| API on `php artisan serve` (`http://localhost:8000`) | `http://localhost:8000/api/v1/auth/google/callback` | `VITE_API_URL=http://localhost:8000` |
| API on Herd (`http://career-backend.test`), using the dev proxy | `http://localhost:5173/api/v1/auth/google/callback` | `VITE_API_URL=http://career-backend.test`, `VITE_API_PROXY=http://career-backend.test` |
| Production | `https://<api-domain>/api/v1/auth/google/callback` | `VITE_API_URL=https://<api-domain>` |

With the Herd proxy, the callback goes through the careers dev server so the sign-in cookie is set on `localhost`. `FRONTEND_CAREERS_URL` must be the careers site's address (`http://localhost:5173` locally). If a candidate sees "Google sign-in isn't set up yet", the client ID is empty; "Google sign-in didn't work" usually means the redirect URI in Google Cloud doesn't match `GOOGLE_REDIRECT_URI` exactly.

### Google Calendar (interviews)

Interviews are written to one shared HR calendar with a service account. No Google SDK is installed; the API signs its own token.

1. In Google Cloud, enable the **Google Calendar API** and create a **service account**. Create a JSON key and save it as `storage/app/private/google-calendar.json` (never inside `public/`).
2. In Google Calendar, open the HR calendar's settings and **share it with the service account's email** with "Make changes to events".
3. Set `GOOGLE_CALENDAR_ID` to the calendar id (Settings → Integrate calendar). `GOOGLE_CALENDAR_CREDENTIALS` points at the key file; relative paths are inside `career-backend`.
4. Optional: to add the interviewer as an attendee, give the service account domain-wide delegation in Google Workspace and set `GOOGLE_CALENDAR_IMPERSONATE` to an HR mailbox. Without it, events are created on the calendar without attendees.
5. In the portal, Settings → System health → Google Calendar → **Test**.

Candidates are never added to events, so the system never sends them invitations. If a sync fails the round is still saved, the scheduler gets a notification, and Interviews shows **Retry sync**.

### Virus scanning (optional)

Resumes and website images can be scanned by ClamAV before they are stored. Install ClamAV with the `clamd` daemon (Linux: `apt install clamav-daemon`; Windows: the ClamAV installer, then start `clamd`), then set either `CLAMAV_HOST=127.0.0.1:3310` or `CLAMAV_SOCKET=/var/run/clamav/clamd.ctl`. Infected files are rejected with a clear message. If ClamAV is configured but not answering, uploads are refused and the person is asked to try again; set `CLAMAV_FAIL_OPEN=true` to accept them instead. With both settings empty, scanning is off.

### Rate limits

Public read endpoints (job search, landing content) allow `RATE_LIMIT_PUBLIC_PER_MINUTE` requests per minute per IP (default 600), because many candidates can share one IP during a campus drive. Applying, Quick apply, the talent form, sign-in and exports have their own stricter limits.

### Spam protection

Set `TURNSTILE_SECRET` (and `VITE_TURNSTILE_SITE_KEY` in the frontend) in production. Without it, Quick apply and the talent form rely on the honeypot and rate limits.

Production cookies need `SESSION_DOMAIN=.infolksgroup.com` and `SESSION_SECURE_COOKIE=true`. See `docs/DEPLOYMENT.md`.

## Mail, queues, scheduler

Emails, exports and calendar sync are queued. `composer run dev` already runs `queue:listen`. In production, Supervisor runs `php artisan queue:work` and cron runs `* * * * * php artisan schedule:run`.

Scheduled tasks (all in `routes/console.php`):

| Command | When | What it does |
|---|---|---|
| `jobs:auto-close` | daily 00:05 IST | Closes jobs past their last date and tells the creator |
| `blocks:lift-expired` | hourly | Reports 6-month blocks that have lapsed |
| `interviews:send-reminders` | every 5 minutes | Reminds the scheduler about 60 minutes before an interview |
| `jobs:notify-closing` | daily 09:00 IST | Tells creators a job closes in 3 days |
| `hr:daily-digest` | weekdays 08:30 IST | Emails the digest to HR users who opted in |
| `notifications:prune` | daily | Deletes read notifications older than 90 days |
| `queue:prune-failed` | daily | Removes failed jobs older than 30 days |

Talent community campaigns send in batches of 100 using job batches, so a large list never blocks the queue. Run `php artisan schedule:list` to check the schedule.

SPF, DKIM and DMARC belong on the domain that sends `careers@infolksgroup.com`.

## Careers page content and photos

The careers page follows the Infolks Group career page document: opening banner, our companies, a place to belong,
interview procedure, quick apply, FAQs and footer. All of its text and photos live in the database and HR edits them
in the portal under **Website Content**, one tab per section.

To load the document's copy into an existing database (it updates the text and hides older FAQs, steps and cards; nothing is deleted):

```bash
php artisan migrate
php artisan db:seed --class=EntitySeeder
php artisan db:seed --class=WebsiteContentSeeder
php artisan optimize:clear
```

The default photos are free Unsplash photos (Unsplash License) that load from Unsplash's image CDN; the list is in
`database/seeders/Support/Photos.php`. Replace them with real Infolks Group photos in Website Content: the banner photo,
each company's card photo, the culture photos (festivals, football, trips, birthdays), and the interview and quick apply photos.
Uploads are resized and converted to WebP by the queue worker.

## Adding a company, department or team

Entities, departments and teams are rows, not code.

- Entity: name, slug, theme colours. The four seeded companies are Infolks, Webfolks, Dataways and Medrays.
- Department: name and slug. Teams optionally belong to a department.
- Re-running `php artisan db:seed` updates existing rows and does not duplicate them.

Departments, teams and skills are managed in the portal under **Settings → Departments, teams & skills** (Admin). Items used by jobs can be deactivated but not deleted.

Website copy (banner, numbers, about blocks, interview steps, stories, drives, videos, FAQs, recognitions, social links, footer, entity cards) is edited in the portal under **Website Content**. Uploaded photos are re-encoded to WebP on the queue, which also removes EXIF and location data; they appear on the site once processed. Run `php artisan storage:link` once so `public/storage` serves them.

## Tests

```bash
php artisan test
```

Feature tests use sqlite in memory. The app database stays MySQL.

End-to-end browser tests live in `career-site/e2e` and `hr-portal/e2e` (see each app's README). CI runs everything on every push: `.github/workflows/ci.yml`.

Tests for interviews, notifications, the talent community, website content, the dashboard, settings and the audit log are in `tests/Phases` (added to `phpunit.xml`). They use `tests/TestCase.php` and Pest's `RefreshDatabase`.
