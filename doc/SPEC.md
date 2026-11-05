# Build Spec: Infolks Group Careers Website & HR Recruitment Portal (v6)

> **How to use this spec with any AI coding agent** (Claude Code, Cursor, Windsurf, GitHub Copilot, OpenAI Codex, Cline, Aider, and others)
> 1. Project folder: `D:\infolks\career\` contains `career-backend\` (Laravel) and `career-frontend\` (React). **Open the `career` folder itself** in your agent, so it can see both projects. Save this file as `career\docs\SPEC.md`.
> 2. Put the source documents in `docs/` with these names: `requirements.pdf`, `landing-page-guide.pdf`, `dashboard-reference.png`.
> 3. Save the companion file `AGENTS.md` in the `career` folder (next to the two project folders). It holds the short rules the agent must follow on every task. Most agents read `AGENTS.md` automatically. For the ones that don't, point them to it:
>
>    | Agent | What to do |
>    |---|---|
>    | Claude Code | Create `CLAUDE.md` containing the single line `@AGENTS.md` (or copy the file to `CLAUDE.md`) |
>    | Cursor | Reads `AGENTS.md`; optionally also copy it to `.cursor/rules/project.mdc` with `alwaysApply: true` |
>    | Windsurf | Reads `AGENTS.md`; or copy it to `.windsurf/rules/project.md` |
>    | GitHub Copilot | Copy it to `.github/copilot-instructions.md` |
>    | Codex, Cline, Aider, others | Reads `AGENTS.md`, or mention it in your first message |
>
> 4. Use the agent's **agent / autonomous mode** (the one that can edit files and run commands). Run **one phase at a time** with the starter prompts in section 19. Review, run and commit after each phase before starting the next.
> 5. **Chat-only AI** (e.g. a chat window that can't edit files): attach this file and the source documents, and paste one starter prompt at a time. Ask for complete files, and apply them yourself.

You are a senior full-stack engineer. Build the complete project described below, end to end, as production-quality code. Work through the phases in section 15. Finish each phase fully (code, migrations, seeders, tests, responsive check) before moving on. Keep the codebase simple, consistent, fast, secure and easy for a small in-house team to maintain.

**Source documents (attach all three when you run this prompt):**
1. *Infolks Group Careers Website & HR Recruitment Portal – Finalised requirements* (2 Nov 2026): business rules and portal features (IDs such as LP, JS, JD, PR, AF, AR, TC, HA, CI). Section 17 maps every ID to where it is built.
2. *Careers Landing Page Guide* (v2, Rahul K, HR, Oct 2026): landing page sections, layout and content. **Where the two differ on the landing page, the guide wins** (resolved conflicts are listed in section 18).
3. *Portal dashboard reference design* (image "Career Overview"): the visual style for **both** apps: the blue gradient sidebar, soft glassy cards, sparkline stat cards, pipeline tiles, gradient charts and animated, modern feel. Copy its **style**, not its wording: section 3.4 lists what to change so it follows the requirements.

---

## 1. Product summary

Infolks Group (the parent company) needs three things:

1. **Careers website** (public React app): a nine-section landing page, job search and job detail pages, Google sign-in, one candidate profile, applying for jobs, a quick (general) application, My Applications, and the talent community.
2. **HR recruitment portal** (private React app): jobs, candidates, applications, interviews, talent community campaigns, website content, notifications and settings. It uses the **same visual design system as the careers website** so both feel like one product.
3. **Laravel API** (`career-backend`): one backend serving both apps. The careers website and the HR portal are two separate builds of `career-frontend`.

Jobs are created only in the portal and appear on the website automatically. Profiles and applications from the website appear in the portal automatically. The website replaces `infolksgroup.com/career`.

### Naming rules (follow everywhere: UI, seed data, emails, code labels)
- **Infolks Group** is the parent company. It owns the careers page, the HR department and the portal.
- The **entities** under the group are **Infolks**, **Webfolks**, **Dataways** and **Medrays**.
- "Infolks" is an entity and must **never** be used to mean the group. Never write "Infolks" where "Infolks Group" is meant, or the other way round.

---

## 2. Tech stack

### Project layout: two separate projects in one folder, **no Docker**
```
D:\infolks\career\
├── AGENTS.md                 Rules for the AI agent (CLAUDE.md for Claude Code)
├── docs\                     SPEC.md, requirements.pdf, landing-page-guide.pdf, dashboard-reference.png, DEPLOYMENT.md
├── career-backend\           Laravel (the version already installed, 11 or newer; PHP 8.3) REST API: its own composer.json, .env, README
└── career-frontend\          ONE React + Vite project (JavaScript) that builds TWO separate apps:
    ├── careers.html           entry for the public careers website
    ├── portal.html            entry for the private HR portal
    ├── vite.careers.config.js  dev port 5173 → build to dist/careers
    ├── vite.portal.config.js   dev port 5174 → build to dist/portal
    ├── tailwind.config.js     extends src/shared/ui/tailwind.preset.js
    ├── package.json  .env.example  README.md
    └── src\
        ├── shared\            used by BOTH apps (never imports from careers/ or portal/)
        │   ├── ui\            reusable components, tailwind.preset.js, motion.js, illustrations/
        │   ├── api\           createClient.js (Axios), query client, error mapping
        │   ├── hooks\         useDebounce, useUrlFilters, useMediaQuery, useToast, …
        │   ├── validation\    Zod schemas (application form, quick apply, job, …)
        │   ├── constants\  utils\ (formatters: dates dd-mm-yyyy, currency, phone)
        │   └── styles\index.css
        ├── careers\           main.jsx, App.jsx, routes.jsx, layouts/, pages/, features/, assets/
        └── portal\            main.jsx, App.jsx, routes.jsx, layouts/, pages/, features/, assets/
```
- **Why one React project with two builds:** HA-01 requires the portal to be a separate application. Two entry points and two Vite configs produce **two separate bundles** that are deployed separately (e.g. `careers.infolksgroup.com` and `hr.infolksgroup.com`). No portal code is ever shipped to the public site. Shared components stay in one place (`src/shared`).
- **Import aliases** in both Vite configs: `@shared` → `src/shared`, `@careers` → `src/careers`, `@portal` → `src/portal`. Add an ESLint rule (`no-restricted-imports`) so `careers` and `portal` never import from each other.
- **Git:** one repository at `D:\infolks\career\` (covering docs, backend and frontend), with a `.gitignore` that excludes `vendor`, `node_modules`, `.env`, `dist`, `storage/*.key` and uploads.

### Local environment (no Docker)
- **Requirements:** PHP 8.3 (extensions: pdo_mysql, mbstring, intl, gd or imagick, zip, bcmath, fileinfo, openssl), Composer 2, Node 20 LTS + npm 10, MySQL 8.
- **Supported local setups:** Laravel Herd (Windows/macOS), Laragon or XAMPP (Windows), or a native PHP + MySQL install. Document all three in the README.
- **Redis is optional.** The defaults must work without it:
  - `QUEUE_CONNECTION=database`
  - `CACHE_STORE=database`
  - `SESSION_DRIVER=database`

  Setting `REDIS_*` and switching the drivers to `redis` in production must work with no code changes.
- **Mail in development:** `MAIL_MAILER=log` by default (emails written to `storage/logs`), with Mailtrap as the documented option.
- **Backend scripts** (`career-backend/composer.json`):
  - `composer run setup` runs `composer install`, copies `.env.example` to `.env` if missing, then runs `key:generate`, `storage:link` and `migrate --seed`.
  - `composer run dev` uses `concurrently` (the default Laravel `dev` script, adjusted) to start `php artisan serve` (port 8000), `php artisan queue:listen` and `php artisan schedule:work`.
- **Frontend scripts** (`career-frontend/package.json`):
  - `npm run dev` starts both apps with `concurrently`.
  - `dev:careers` / `dev:portal` start one app; `build` / `build:careers` / `build:portal` build them.
  - Also: `lint`, `test`, `preview:careers`, `preview:portal`.
- **Local URLs:** API `http://localhost:8000`, careers `http://localhost:5173`, portal `http://localhost:5174`.
- **Backend `.env` for Sanctum SPA cookie auth across these origins:**
  - `SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:5174`
  - `SESSION_DOMAIN=localhost`
  - `FRONTEND_CAREERS_URL` and `FRONTEND_PORTAL_URL`
  - `config/cors.php`: allow exactly these two origins, with `supports_credentials=true`.
- **Frontend `.env`:** `VITE_API_URL=http://localhost:8000`, `VITE_CAREERS_URL`, `VITE_PORTAL_URL`, `VITE_GOOGLE_LOGIN_URL`, `VITE_TURNSTILE_SITE_KEY`.
- **Production domains** must share the parent domain so the cookies work:
  - `api.infolksgroup.com`, `careers.infolksgroup.com` (or the `/career` path on the main site) and `hr.infolksgroup.com`.
  - `SESSION_DOMAIN=.infolksgroup.com`.
- Each project has its own README (setup, scripts, env). `docs/DEPLOYMENT.md` covers deploying both.
- **Production:** a Linux VPS or cPanel host with Nginx or Apache + PHP-FPM.
  - Supervisor (or cPanel cron) runs `queue:work`, and a cron entry runs `* * * * * php artisan schedule:run`.
  - Both React apps are built to static files and served by Nginx/Apache, with the SPA fallback to `index.html`.
  - Document example Nginx and Apache configs in `docs/DEPLOYMENT.md`.

### Frontend: **plain JavaScript only, no TypeScript**
- React 18 + **Vite**. Only `.js` / `.jsx` files. No `.ts` / `.tsx`, no `tsconfig.json`, no type annotations. Use JSDoc on shared components and PropTypes on `src/shared/ui` components.
- **Tailwind CSS v3** for all styling. No other CSS framework, no CSS-in-JS. Design tokens live in one shared Tailwind preset (`src/shared/ui/tailwind.preset.js`) used by `career-frontend/tailwind.config.js` for both apps. Use `@tailwindcss/forms` and `@tailwindcss/typography`.
- **Icons: Heroicons only** (`@heroicons/react`, outline 24 for UI, solid 20 / mini for small controls). No lucide, font-awesome, react-icons or any other icon set. Heroicons has no brand logos, so social media icons in the footer are plain SVG files in `/assets/social/` taken from each platform's official brand assets (or the letter circles shown in the guide). They are not an icon library.
- **Headless UI** (`@headlessui/react`, made by the Tailwind team) for accessible dialogs, menus, listbox, combobox, tabs, disclosure and transitions. Do **not** use shadcn/ui or any component kit that ships its own icons.
- React Router v6 with **route-level code splitting** (`React.lazy` + `Suspense`).
- **TanStack Query** for all server state (caching, prefetching, optimistic updates).
- **React Hook Form + Zod** for forms. Shared Zod schemas live in `src/shared/validation`. The backend Form Requests apply the same rules.
- **TanStack Table** inside the shared `DataTable` component in the portal.
- Axios client factory in `src/shared/api/createClient.js`: base URL from `.env`, credentials, CSRF cookie bootstrap, a 401 redirect, and normalised error messages for toasts and form errors.
- `libphonenumber-js` for phone fields, `dayjs` for dates (display format **dd-mm-yyyy**), **TipTap** for rich text (FAQ answers, company updates), toolbar icons from Heroicons.
- ESLint (react, react-hooks, jsx-a11y, import) + Prettier + Husky/lint-staged.

### Backend
- Laravel (installed version, 11 or newer), MySQL 8 (utf8mb4). The database drivers handle cache, queue and sessions by default; Redis is optional for production.
- **Auth:** Laravel **Sanctum SPA cookie authentication**, using httpOnly secure cookies with CSRF protection. Do not store tokens in localStorage.
  - Candidates sign in with **Google only**, through Laravel Socialite.
  - **Two guards:** `web` (HR `users` table) and `candidate` (session guard, `candidates` provider). Sanctum `guard` config is `['web', 'candidate']`; candidate routes use `auth:candidate`, HR routes use `auth:web`.
  - HR users sign in with email and password, with optional **TOTP two-factor** (required for Admin). Roles and permissions use **spatie/laravel-permission**.
- API Resources for every response, Form Requests for every input, Policies for every model, PHP backed Enums for every status, Service classes for business logic, and Events + Listeners for notifications and side effects.
- Routes are versioned under `/api/v1` and split into `public/*`, `candidate/*` and `hr/*`.
- Queues (database driver by default, Redis optional) carry all emails, exports, calendar sync and campaign sends. Failed jobs are visible to Admin under Settings → System health, with a retry button.
- The scheduler runs: lift expired blocks, auto-close jobs past their last date, interview reminder notifications, a daily HR digest, and pruning of old notifications and logs.
- Excel export uses `maatwebsite/excel`, **queued**, and notifies the user when the file is ready.
- Google Calendar uses `google/apiclient` to create, update and cancel interview events.
- Pest feature tests cover every business rule in section 8 and every permission in section 4.7.

### Easy to manage
- Two terminals:
  - In `career-backend`: `composer run setup`, then `composer run dev`.
  - In `career-frontend`: `npm install`, then `npm run dev`.

  There is no Docker and no extra services. Redis is optional.
- Seeders create: the four entities with themes; departments and teams; skills; one Admin and one HR user (credentials printed in the console and the README); about 20 job postings across entities; about 60 candidates with applications and interviews; and sample website content (FAQs, interview steps, stories, drives, recognitions, social links, media).
- Every app has a fully commented `.env.example`.
- The README covers:
  - Local setup (Herd / Laragon / XAMPP), environment variables, and Google OAuth and Google Calendar setup.
  - Mail, queues and the scheduler (cron + Supervisor), deployment, and backups.
  - Adding an entity, department or team, and editing website content.
- Clear folder structure, no dead code, and short comments only where the logic is not obvious.

---

## 3. Design system (Landing Page Guide layout + reference design style)

Both apps share one modern, attractive and lightly animated design language. The **layout and content** of the landing page come from the guide. The **visual style** (colours, depth, cards, charts, motion) comes from the dashboard reference image. **Before launch, compare the tokens with the redesigned Infolks Group website and adjust them in the Tailwind preset only.**

### 3.1 Tokens (`src/shared/ui/tailwind.preset.js`)
| Token | Approx. value | Use |
|---|---|---|
| `brand-900` | `#0A3D85` | Sidebar gradient end, hero gradient end, footer, headings on light backgrounds |
| `brand-700` | `#0B4FA3` | Sidebar gradient start, hero gradient start |
| `brand-600` | `#1976D2` | Primary buttons, links, active states, chart line |
| `brand-500` | `#1E88E5` | Primary button gradient end, focus ring |
| `brand-100` / `brand-50` | `#DCEBFB` / `#EEF5FD` | Tinted icon circles, pipeline tiles, **app background** |
| `navy` | `#1F3A68` | Section titles (from the guide), table headers |
| `accent-orange` | `#F39223` | Careers site main CTA only (hero "Job Search"), from the guide |
| `cyan` / `teal` / `amber` / `violet` | `#29B6F6` / `#22C3A6` / `#FFC233` / `#9C6ADE` | Stat icon circles, chart series, donut segments |
| `success` / `warning` / `danger` / `info` | `#16A34A` / `#F59E0B` / `#DC2626` / `#0EA5E9` | Trends, status pills, toasts |
| `card` | `#FFFFFF` (or `white/80` + `backdrop-blur` on gradient areas) | Cards |
| `border` | `#E2E8F0` | Card and input borders |
| `text` / `muted` | `#0F172A` / `#64748B` | Body / secondary text |
| Radius | `rounded-2xl` cards, `rounded-xl` inputs & tiles, `rounded-full` pills | |
| Shadow | `shadow-[0_8px_30px_rgba(25,118,210,0.08)]` (soft blue), with a stronger shadow on hover | |
| Font | **Poppins** for headings + **Inter** for body (self-hosted, `font-display: swap`) unless the group site uses others | |

Status pill colours are defined once in `StatusBadge`: Applied = blue, Under review = sky, Shortlisted = green, Interview scheduled = violet, Selected = emerald, Rejected / Not selected = red-soft, Draft = slate, Published = green, Closed = slate-dark. Pills are pastel backgrounds with darker text, as in the reference.

The entity themes (colours, logo, pattern) come from the API and are applied through CSS variables (`--entity-primary`, `--entity-secondary`, `--entity-accent`, `--entity-pattern`), only inside entity-scoped components (entity cards, job cards, job detail header).

### 3.2 Visual style (from the reference image)
- **Background:** a light blue `brand-50` page with large, soft, blurred gradient shapes (decorative SVG blobs and waves at low opacity, `pointer-events-none`, `aria-hidden`).
- **Sidebar (portal):** a vertical gradient from `brand-700` to `brand-900` with subtle wave shapes. White logo at the top. Nav items have white Heroicons with labels. The **active item is a lighter blue pill with a soft glow**. A brand illustration sits at the bottom with "Building Great Teams Together".
- **Top bar:** a large rounded white search pill on the left (`MagnifyingGlassIcon`). On the right: a bell with a red count badge, then an avatar with name and role and a chevron menu.
- **Page header:** a large bold title (e.g. "Career Overview"), a friendly welcome line ("Welcome back, {first name}! Let's build a stronger team together." with a small heart), and primary actions on the right: a **gradient blue filled pill button** with an icon and an **outlined white pill button**.
- **Stat cards:** a white rounded card with a tinted circular icon (blue, cyan, amber, teal), a label, a large bold number, a green or red trend line (`ArrowUpIcon` / `ArrowDownIcon` + "+12% from last month") and a **gradient area sparkline** on the right.
- **Pipeline:** a row of rounded tiles with pastel gradient fills (blue → teal), each with a Heroicon, stage name and big count, joined by chevrons (`ChevronRightIcon`). The final stage tile is solid brand blue with white text.
- **Charts:** a smooth gradient-filled area line chart with dot markers, a navy tooltip pill ("1,420 Applications") and range toggles (1M / 3M / 6M / 1Y pills). A donut chart has its main % in the centre and a legend with dots and percentages.
- **Lists and tables:** rows with round avatars, a bold name with a muted subtitle, the date/time stacked, pastel status pills, and a kebab menu (`EllipsisHorizontalIcon`). Each card has a "View all →" link at its top right.
- **Promo card:** a gradient card with a photo or illustration on the right, a bold headline, a short tagline ("Innovate • Learn • Belong") and an outlined CTA.

### 3.3 Careers site in this style
- **Hero:** the `brand-700 → brand-900` gradient with floating blurred shapes and a real team photo or a brand illustration on the right (stacked below the text on mobile). The motto is a large heading with a short company line, followed by the orange **Job Search** pill (from the guide) and an outlined "Quick apply" pill that scrolls to section 7.
- The guide's sections keep their order and content, but use the reference card style: rounded-2xl white cards on the light blue background, tinted icon circles in About, and a stepper with gradient-filled circles and a progress line.
- Entity cards keep each entity's own theme but use the same card shape, shadow and hover motion so the page stays consistent.

### 3.4 Changes to the reference image so it follows the requirements (must do)
| Reference shows | Build instead | Why |
|---|---|---|
| Logo "Infolks" in the sidebar, "Grow Your Career with Infolks" | **Infolks Group** logo and "Grow your career with Infolks Group" | Infolks is an entity, never the group (Req. §2) |
| User role "Recruiter" | "Admin" or "HR" | Only these two roles exist (HA-02) |
| Pipeline: Applied → Screening → Shortlisted → Interview → Offered → Hired | **Applied → Under review → Shortlisted → Interview → Selected** (+ Rejected / Not selected shown as small counts) | Statuses per §6.2; no offer or Joined/Hired status (CI-05) |
| Hiring sources: Organic Search, LinkedIn, Referral, Others | **Career website, Job alert, Referral, Quick apply** | Sources defined in CI-02 (+ Quick apply from the guide) |
| "Add Candidate" button | "Send Job Alert" (opens the campaign composer) | Candidates come only from the website (§1, PR-05) |
| Candidate photos in tables | The Google profile photo if the candidate signed in with Google, otherwise an **initials avatar** with a colour from the name | Candidates don't upload photos; keep data minimal |
| Interview status pills "Scheduled / Interview" | Round statuses: Scheduled, Completed, Passed, Not selected | §6.2 Interviews |
| No Applications item in the sidebar | Keep **Applications** in the sidebar | It is one of the five required sections (§6.2) |

### 3.5 Motion and animation (attractive but fast)
Use **Framer Motion** with `LazyMotion` + `domAnimation` (small bundle), plus Tailwind transitions for simple hovers. Shared presets live in `src/shared/ui/motion.js`. Default timings are **150–250 ms** for UI and **400–600 ms** for entrances, with ease-out curves. Animate only `transform` and `opacity`.

- **Page transitions:** fade + 8px slide-up between routes (`PageTransition`).
- **Scroll reveal:** sections, cards and grid items fade and rise into view, with a **staggered** entrance (`Reveal`, `StaggerGroup`, using IntersectionObserver, once only).
- **Numbers:** stat numbers and hero counters **count up** from 0 when visible (`AnimatedNumber`).
- **Charts:** sparklines and area lines draw in (stroke-dashoffset), donut segments sweep in, and pipeline tiles pop in one after another with the chevrons fading in.
- **Hover and press:** cards lift by 2–4px with a stronger shadow, and buttons scale to 0.97 on press. Entity cards get a subtle tilt or shine and their logo scales slightly. Job cards show an animated arrow on hover.
- **Hero:** slow floating gradient blobs (CSS keyframes, 12–20 s loops) and a gentle parallax on the hero image (desktop only).
- **Stepper:** the progress line fills as it scrolls into view and the step circles pulse once.
- **Feedback:**
  - Toasts slide in and the accordion animates its height.
  - Modals and slide-overs fade and scale or slide.
  - The bell **wiggles** once when new notifications arrive, and the unread badge pops.
  - Successful submits show an animated check (`CheckCircleIcon` with a stroke draw), and skeletons shimmer.
- **Recognitions row:** a slow auto-scrolling marquee on mobile that pauses on hover or focus.
- **Must:**
  - Respect `prefers-reduced-motion`: switch to fades only, with no parallax, marquee or count-up.
  - No animation may block input or delay content longer than 600 ms.
  - Never animate layout properties.

### 3.6 Images and illustrations
- **Real photos first:** HR supplies employee stories, recruitment drive photos, team and office photos, and entity logos. Upload them through Website Content (section 6.9). They are resized, converted to WebP/AVIF and stripped of EXIF data on the server.
- **Placeholders until real photos arrive:**
  - Use free-licence stock (Unsplash or Pexels) showing **Indian professionals in modern offices**: diverse, natural, bright, and on a blue/white palette to match the brand.
  - Suggested placements:
    - Hero: a team collaborating at laptops.
    - About: one photo per block (teamwork, learning/training, culture/celebration).
    - Life at the group: a candid office moment.
    - Portal promo card: a team photo, as in the reference.
    - Portal login: a split-screen photo or illustration.
  - Store them in `career-frontend/src/careers/assets/images/` and `src/portal/assets/images/` with credits in `CREDITS.md`, and seed them as content so HR can replace them.
- **Illustrations:** use a consistent flat style recoloured to `brand-600` (e.g. unDraw) for: empty states (no jobs found, no applications yet, no notifications), 404/500 pages, the "Profile incomplete" banner, the portal sidebar footer ("Building Great Teams Together"), and the Quick apply success panel. Put them in `src/shared/ui/illustrations/` as optimised inline SVG React components.
- **Decorative shapes:** gradient blobs and waves as small inline SVGs, not image files.
- **Entity patterns:** each entity's pattern SVG is applied as a subtle background on its card and job detail header.
- **Rules:**
  - Every image has width and height (no layout shift), `alt` text (decorative ones have `alt=""`), `loading="lazy"` below the fold, and `srcset`.
  - The hero image is preloaded and under 150 KB.
  - Don't use photos of real public figures, and don't use the entities' logos anywhere they don't belong.

### Shared reusable components (`career-frontend/src/shared/ui`)
Build these once, document their props with JSDoc and PropTypes, and use them in both apps. **No one-off duplicates in the apps.**

- **Layout:** `Container`, `Section` (title, intro, background variant), `PageHeader` (title, breadcrumbs, actions), `Grid`, `Stack`.
- **Actions:** `Button` (primary / secondary / orange CTA / ghost / danger; sizes; loading; icon left/right), `IconButton`, `LinkButton`, `Dropdown` menu.
- **Forms:** `FormField` (label, hint, error, required mark), `Input`, `Textarea`, `Select` (Listbox), `Combobox`, `MultiSelect` (type-ahead chips), `DateInput` (dd-mm-yyyy), `DateRangePicker`, `PhoneInput` (country code), `FileUpload` (drag & drop, type/size check, progress), `Checkbox`, `RadioGroup`, `Switch`, `RichTextEditor`, `SearchInput` (debounced).
- **Display:** `Card`, `EntityCard`, `JobCard`, `StatCard`, `Badge`, `StatusBadge` (all status enums mapped to colours in one place), `EntityBadge`, `Tag`, `Avatar`, `Stepper` (horizontal ≥ md, vertical below md), `Accordion`, `Tabs`, `Tooltip`, `Timeline` (notes and activity), `DescriptionList`, `ImageWithFallback` (lazy, srcset, blur placeholder), `InitialsAvatar`, `PromoCard`, `Illustration`.
- **Charts and motion:** `StatCard` (icon circle, number, trend, sparkline), `Sparkline` (light custom SVG), `TrendIndicator`, `PipelineStages`, `AreaChart`, `DonutChart` (Recharts, lazy loaded), `RangeToggle`, `AnimatedNumber`, `Reveal`, `StaggerGroup`, `PageTransition`, `GradientBlobs`, `Marquee`.
- **Feedback:** `Toast` system (`ToastProvider` + `useToast`), `Alert` / `Banner`, `Modal`, `SlideOver` (drawer), `ConfirmDialog`, `Spinner`, `Skeleton` (card, row and table variants), `EmptyState`, `ErrorState` (with retry), `ProgressBar`.
- **Data:** `DataTable` (server-side sort, pagination, row selection, bulk actions, column visibility, sticky header, **cards on mobile**), `FilterBar`, `FilterChips` (removable active filters + "Clear all"), `ResultCount`, `Pagination`, `SavedFilters`.
- **Notifications:** `NotificationBell`, `NotificationList`, `NotificationItem`.

Every component must be keyboard accessible with visible focus rings, meet WCAG 2.1 AA contrast, handle loading, empty and error states where relevant, and work from 320px wide upwards.

---

## 4. Database: migrations, models and relationships

### 4.1 Conventions
- MySQL 8, `utf8mb4_unicode_ci`. Every table has a `bigIncrements` `id` and `timestamps()` unless noted.
- Enum-like columns are `string(30)` cast to **PHP backed Enums** (no MySQL `ENUM`), so new values need no schema change.
- Foreign keys use `foreignId()->constrained()`, with explicit `cascadeOnDelete` / `nullOnDelete` / `restrictOnDelete` as stated below.
- **Public IDs:** `job_postings`, `candidates`, `applications` and `campaigns` have a `public_id` (`char(26)`, ULID, unique). It is the route key (`getRouteKeyName()`) and the only ID exposed in URLs and API responses (shared trait `HasPublicId`).
- **Never hard-delete** candidates or applications: there are no delete routes, and their foreign keys use `restrictOnDelete`. Content tables use `SoftDeletes`.
- Money is `decimal(12,2)`, years of experience `decimal(4,1)`, dates `date`, and moments `timestamp`.
- The job table is named **`job_postings`** (model `JobPosting`) so it never clashes with Laravel's queue `jobs` table or `Job` classes. The public URLs still use `/jobs`.

### 4.2 Migration order and columns

**Framework tables** (from Laravel and packages, keep as generated): `users`, `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `personal_access_tokens` (Sanctum), the spatie permission tables (`permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions`), and `notifications` (`php artisan make:notifications-table`).

**1. `add_hr_fields_to_users_table`**

| Column | Definition |
|---|---|
| phone | string(20) nullable |
| avatar_path | string nullable |
| is_active | boolean default true, index |
| two_factor_secret | text nullable (encrypted cast) |
| two_factor_recovery_codes | text nullable (encrypted cast) |
| two_factor_confirmed_at | timestamp nullable |
| last_login_at | timestamp nullable |
| last_login_ip | string(45) nullable |
| failed_login_attempts | unsignedTinyInteger default 0 |
| locked_until | timestamp nullable |
| deleted_at | softDeletes |

**2. `create_entities_table`**

| Column | Definition |
|---|---|
| name | string(50) unique |
| slug | string(50) unique |
| logo_path | string nullable |
| motto | string(150) nullable |
| short_description | text nullable |
| primary_color, secondary_color, accent_color | string(7) |
| pattern_path | string nullable |
| website_url | string nullable |
| sort_order | unsignedSmallInteger default 0 |
| is_active | boolean default true |

**3. `create_departments_table`:** name string(100) unique; is_active boolean default true, index; sort_order unsignedSmallInteger default 0; softDeletes.

**4. `create_teams_table`:** department_id → departments, nullable, nullOnDelete; name string(100); is_active boolean default true; softDeletes; unique (department_id, name).

**5. `create_skills_table`:** name string(80) unique; slug string(80) unique; is_active boolean default true.

**6. `create_job_postings_table`**

| Column | Definition |
|---|---|
| public_id | char(26) unique |
| title | string(150) |
| slug | string(180), index |
| role_key | string(150), index (lower-case normalised title; editable) |
| entity_id | → entities, restrictOnDelete |
| department_id | → departments, nullable, nullOnDelete |
| team_id | → teams, nullable, nullOnDelete |
| level | string(30) (`internship`, `all_level`), index |
| location | string(120), index |
| summary | text |
| qualification | text |
| experience | string(150) |
| why_join_us | text nullable |
| last_date_to_apply | date, index |
| status | string(30) default `draft`, index |
| posted_at | timestamp nullable, index |
| published_at, closed_at | timestamp nullable |
| created_by, updated_by | → users, nullable, nullOnDelete |
| deleted_at | softDeletes (drafts only; postings with applications can only be closed) |

Indexes: composite (status, last_date_to_apply), (entity_id, status), and `fullText(['title','summary'])`.

**7. `create_job_posting_skill_table`:** job_posting_id → cascadeOnDelete; skill_id → cascadeOnDelete; primary key (job_posting_id, skill_id).

**8. `create_candidates_table`**

| Column | Definition |
|---|---|
| public_id | char(26) unique |
| google_id | string nullable unique |
| avatar_url | string nullable (Google photo) |
| email | string unique |
| email_verified_at | timestamp nullable |
| name | string(100) |
| date_of_birth | date nullable |
| phone | string(20) nullable, index (E.164) |
| location | string(120) nullable, index |
| gender | string(30) nullable, index |
| highest_qualification | string(150) nullable |
| preferred_department_id | → departments, nullable, nullOnDelete |
| years_experience | decimal(4,1) nullable, index |
| current_ctc, expected_ctc | decimal(12,2) nullable |
| reference_id | string(50) nullable |
| linkedin_url, portfolio_url | string(255) nullable |
| resume_path | string nullable |
| resume_original_name | string nullable |
| resume_uploaded_at | timestamp nullable |
| signup_source | string(30) (`google`, `quick_apply`), index |
| profile_completed_at | timestamp nullable |
| colour_tag | string(30) default `not_contacted`, index |
| is_blacklisted | boolean default false, index |
| blacklisted_at, blacklist_until | timestamp nullable |
| blacklist_reason | text nullable |
| blacklisted_by | → users, nullable, nullOnDelete |
| privacy_consent_at | timestamp nullable |
| last_login_at | timestamp nullable |
| remember_token | rememberToken |

Indexes: composite (is_blacklisted, blacklist_until), and fullText(['name','email']).

**9. `create_applications_table`**

| Column | Definition |
|---|---|
| public_id | char(26) unique |
| type | string(30) (`job`, `general`), index |
| candidate_id | → candidates, restrictOnDelete |
| job_posting_id | → job_postings, nullable, restrictOnDelete |
| entity_id | → entities, nullable, nullOnDelete (copied from the posting) |
| department_id | → departments, nullable, nullOnDelete |
| applied_at | timestamp, index |
| source | string(30) (`career_website`, `job_alert`, `referral`, `quick_apply`), index |
| reference_id | string(50) nullable |
| referred | boolean default false, index |
| status | string(30) default `applied`, index |
| result | string(30) nullable (`selected`, `not_selected`), index |
| status_changed_at | timestamp nullable |
| shortlisted_at, rejected_at, result_at | timestamp nullable |
| status_changed_by | → users, nullable, nullOnDelete |
| snapshot | json (the submitted form fields + resume path at the time of applying) |
| resume_path | string (a copy of the resume file at the time of applying) |
| is_flagged | boolean default false (the candidate is blacklisted) |

Indexes and keys: **unique (candidate_id, job_posting_id)** (NULLs allowed for general applications); composite (status, applied_at), (entity_id, status), (type, department_id, status).

**10. `create_application_status_histories_table`:** application_id → cascadeOnDelete; from_status string(30) nullable; to_status string(30); changed_by → users, nullable; note string nullable; created_at only. This powers Undo, the activity tab and time-to-shortlist reports.

**11. `create_interview_rounds_table`**

| Column | Definition |
|---|---|
| application_id | → applications, cascadeOnDelete |
| round_number | unsignedTinyInteger |
| round_name | string(100) |
| scheduled_at | timestamp, index |
| duration_minutes | unsignedSmallInteger default 60 |
| mode | string(30) (`in_person`, `video`, `phone`) |
| location_or_link | string nullable |
| interviewer_name | string(100) |
| interviewer_email | string nullable, index |
| google_event_id | string nullable |
| calendar_sync_status | string(30) default `pending`, index |
| calendar_sync_error | text nullable |
| status | string(30) default `scheduled`, index |
| feedback | text nullable |
| created_by | → users, nullable, nullOnDelete |
| reminder_sent_at | timestamp nullable |

Key: unique (application_id, round_number).

**12. `create_candidate_notes_table`:** candidate_id → candidates, cascadeOnDelete; user_id → users, nullable, nullOnDelete; body text; timestamps; index (candidate_id, created_at).

**13. `create_role_blocks_table`:** candidate_id → candidates, cascadeOnDelete; role_key string(150); blocked_until timestamp; reason string; source_application_id → applications, nullable, nullOnDelete; overridden_by → users, nullable; overridden_at timestamp nullable; override_reason string nullable; index (candidate_id, role_key, blocked_until).

**14. `create_talent_members_table`:** name string(100); email string unique; phone string(20) nullable; candidate_id → candidates, nullable, unique, nullOnDelete; source string(30) (`signin`, `signup_form`, `quick_apply`), index; is_subscribed boolean default true, index; unsubscribe_token char(64) unique; subscribed_at timestamp; unsubscribed_at timestamp nullable; privacy_consent_at timestamp nullable.

**15. `create_campaigns_table`:** public_id char(26) unique; type string(30) (`job_alert`, `company_update`), index; subject string(200); body longText nullable (sanitised HTML); status string(30) default `draft`, index; recipient_count, sent_count, failed_count unsignedInteger default 0; sent_by → users, nullable; scheduled_at, started_at, finished_at timestamp nullable.

**16. `create_campaign_job_posting_table`:** campaign_id → cascadeOnDelete; job_posting_id → cascadeOnDelete; primary key (campaign_id, job_posting_id).

**17. `create_email_logs_table`:** type string(40), index; recipient_email string, index; candidate_id → nullable, nullOnDelete; talent_member_id → nullable, nullOnDelete; job_posting_id → nullable, nullOnDelete; campaign_id → nullable, nullOnDelete; application_id → nullable, nullOnDelete; status string(30) (`queued`, `sent`, `failed`), index; error text nullable; sent_at timestamp nullable, index.

**18. `create_notification_preferences_table`:** user_id → users, cascadeOnDelete; type string(80); in_app boolean default true; email boolean default false; unique (user_id, type).

**19. `create_saved_filters_table`:** user_id → users, cascadeOnDelete; screen string(40); name string(80); query json; is_default boolean default false; is_shared boolean default false; index (user_id, screen).

**20. `create_exports_table`:** user_id → users, cascadeOnDelete; type string(40); filters json; status string(30) (`queued`, `processing`, `ready`, `failed`); row_count unsignedInteger nullable; file_path string nullable; expires_at timestamp nullable.

**21. `create_audit_logs_table`:** user_id → users, nullable, nullOnDelete; action string(60), index; auditable_type + auditable_id (`nullableMorphs`); old_values json nullable; new_values json nullable; ip string(45) nullable; user_agent string nullable; created_at only, index.

**22. Website content tables** (all with `sort_order` unsignedSmallInteger, `is_published` boolean default true, and softDeletes, except `site_settings`):
- `site_settings`: key string(80) unique; value json. Keys: `hero`, `company_numbers`, `about_intro`, `social_links`, `footer`, `promo_card`, `quick_apply_confirmation_text`.
- `about_blocks`: title string(80); body text; heroicon_name string(60).
- `interview_steps`: name string(80); description string(255).
- `employee_stories`: name string(100); role string(100); entity_id → entities, nullable; photo_path string nullable; quote text; publish_permission_confirmed boolean default false.
- `recruitment_drives`: name string(150); drive_date date; caption string(255) nullable; photo_path string.
- `faqs`: question string(255); answer text (sanitised HTML).
- `recognitions`: name string(150); year unsignedSmallInteger nullable; badge_path string; link string nullable.
- `media_items`: type string(30) (`video`, `activity`); title string(150); youtube_url string nullable; photo_path string nullable; caption string(255) nullable.

### 4.3 Enums (`app/Enums`, string-backed, each with `label()` and `color()` for the UI)
- `JobLevel`: Internship, AllLevel.
- `JobStatus`: Draft, Published, Closed.
- `ApplicationType`: Job, General.
- `ApplicationSource`: CareerWebsite, JobAlert, Referral, QuickApply.
- `ApplicationStatus`: Applied, UnderReview, Shortlisted, Rejected.
- `ApplicationResult`: Selected, NotSelected.
- `InterviewMode`: InPerson, Video, Phone.
- `RoundStatus`: Scheduled, Completed, Passed, NotSelected.
- `CalendarSyncStatus`: Pending, Synced, Failed.
- `Gender`: Male, Female, Other.
- `ColourTag`: Contacted, NotContacted.
- `SignupSource`: Google, QuickApply.
- `TalentSource`: Signin, SignupForm, QuickApply.
- `CampaignType`: JobAlert, CompanyUpdate.
- `CampaignStatus`: Draft, Sending, Sent, Failed.
- `EmailType`: ApplicationConfirmation, QuickApplyConfirmation, JobAlert, CompanyUpdate, HrInvite, InterviewReminder, DailyDigest.
- `ExportStatus`: Queued, Processing, Ready, Failed.
- `MediaType`: Video, Activity.

Expose all enum options through `GET /api/v1/public/meta` (public) and `GET /api/v1/hr/meta` (HR), so the frontend never hard-codes the lists.

### 4.4 Models and relationships (`app/Models`)
Every model defines `$fillable` (never `$guarded = []`), `casts()`, its relationships with return types, and reusable query scopes. Models that HR changes use the `Auditable` trait, which writes to `audit_logs` on create, update and delete.

| Model | Traits | Relationships | Casts / scopes / helpers |
|---|---|---|---|
| **User** (HR) | HasApiTokens, HasRoles, Notifiable, SoftDeletes, Auditable | hasMany `createdJobPostings` (JobPosting, created_by), `candidateNotes`, `interviewRounds` (created_by), `campaigns` (sent_by), `savedFilters`, `notificationPreferences`, `exports`, `auditLogs` | password hashed, two_factor_* encrypted, last_login_at datetime; scope `active()`; `isAdmin()` |
| **Entity** | — | hasMany `jobPostings`, `applications`, `employeeStories` | scope `active()`, `ordered()`; accessor `theme` (array of colours + logo + pattern URLs) |
| **Department** | SoftDeletes, Auditable | hasMany `teams`, `jobPostings`, `applications`, `candidates` (preferred_department_id) | scope `active()`, `ordered()` |
| **Team** | SoftDeletes, Auditable | belongsTo `department`; hasMany `jobPostings` | scope `active()` |
| **Skill** | Auditable | belongsToMany `jobPostings` | scope `active()`, `search($q)` |
| **JobPosting** | HasPublicId, SoftDeletes, Auditable | belongsTo `entity`, `department`, `team`, `creator` (User, created_by), `updater` (User, updated_by); belongsToMany `skills`, `campaigns`; hasMany `applications`; hasMany `emailLogs` | level → JobLevel, status → JobStatus, last_date_to_apply date, posted_at/published_at/closed_at datetime. Scopes: `published()`, `open()` (published AND last_date_to_apply ≥ today), `search($q)` (FULLTEXT + skill name + entity name), `filter(array $f)`, `closingWithin($days)`. Accessors: `is_open`, `days_left`, `url`. `withCount('applications')` in HR lists. |
| **Candidate** | Authenticatable, HasPublicId, Notifiable, Auditable | hasMany `applications`, `notes` (CandidateNote, latest first), `roleBlocks`, `emailLogs`; hasMany `activeRoleBlocks` (where blocked_until > now and not overridden); hasOne `talentMember`; belongsTo `preferredDepartment` (Department), `blacklistedBy` (User); belongsToMany `jobPostings` through `applications` (pivot fields applied_at, status) | date_of_birth date, ctc decimal:2, years_experience decimal:1, gender → Gender, colour_tag → ColourTag, signup_source → SignupSource, is_blacklisted bool, blacklist_until datetime. Scopes: `blacklistedNow()`, `search($q)`, `filter(array $f)`. Accessors: `age`, `is_blacklisted_now`, `profile_completion_percent`, `initials`. Hidden: `google_id`, `remember_token`. |
| **Application** | HasPublicId, Auditable | belongsTo `candidate`, `jobPosting`, `entity`, `department`, `statusChangedBy` (User); hasMany `interviewRounds` (ordered by round_number), `statusHistories`, `emailLogs`; hasOne `latestRound` (`latestOfMany('round_number')`), `nextRound` (upcoming, `ofMany`) | type, source, status, result → their Enums; snapshot array; dates datetime. Scopes: `ofType()`, `status()`, `filter(array $f)`, `forEntity()`, `appliedBetween()`. Helpers: `canTransitionTo(ApplicationStatus)`, `display_role` (job title or "General – {department}") |
| **ApplicationStatusHistory** | — | belongsTo `application`, `changedBy` (User) | `$timestamps = false`; created_at datetime |
| **InterviewRound** | Auditable | belongsTo `application`, `creator` (User, created_by); hasOneThrough `candidate` (via application) | mode, status, calendar_sync_status → Enums; scheduled_at datetime. Scopes: `upcoming()`, `today()`, `thisWeek()`, `syncFailed()` |
| **CandidateNote** | — | belongsTo `candidate`, `author` (User, user_id) | — |
| **RoleBlock** | Auditable | belongsTo `candidate`, `sourceApplication` (Application), `overrider` (User, overridden_by) | blocked_until/overridden_at datetime; scope `active()` |
| **TalentMember** | — | belongsTo `candidate`; hasMany `emailLogs` | is_subscribed bool; scope `subscribed()`; creates `unsubscribe_token` on create; `unsubscribeUrl()` (signed) |
| **Campaign** | HasPublicId, Auditable | belongsTo `sender` (User, sent_by); belongsToMany `jobPostings`; hasMany `emailLogs` | type, status → Enums |
| **EmailLog** | — | belongsTo `candidate`, `talentMember`, `jobPosting`, `campaign`, `application` | type → EmailType |
| **NotificationPreference** | — | belongsTo `user` | booleans |
| **SavedFilter** | — | belongsTo `user` | query array; scope `visibleTo(User)` (own + shared) |
| **Export** | — | belongsTo `user` | filters array, status → ExportStatus; `downloadUrl()` (temporary signed URL) |
| **AuditLog** | — | belongsTo `user`; morphTo `auditable` | old_values/new_values array |
| **SiteSetting** | — | — | value array; static `get($key, $default)` / `set($key, $value)` with cache + cache bust |
| **AboutBlock, InterviewStep, Faq, Recognition, RecruitmentDrive, MediaItem** | SoftDeletes, Auditable | — | scope `published()`, `ordered()` |
| **EmployeeStory** | SoftDeletes, Auditable | belongsTo `entity` | scope `published()` (is_published AND publish_permission_confirmed), `ordered()` |

### 4.5 Observers and model events (`app/Observers`)
- **JobPostingObserver:**
  - On saving: build the `slug` and `role_key` from the title (unless HR edited the role_key) and set `updated_by`.
  - On the first publish: set `posted_at` and `published_at`.
  - On close: set `closed_at`.
  - After any save: bust the public job cache.
- **ApplicationObserver:**
  - On creating: set `public_id`, `applied_at`, `entity_id` (from the posting) and `referred` (reference_id not empty); set `source = referral` when a reference ID is present.
  - On a status or result change: write the status history row, set the matching timestamps and fire `ApplicationStatusChanged`. If it was **rejected after shortlisting** or the result is **not_selected**, create the role block (6 months).
  - **No candidate email on status changes.**
- **CandidateObserver:**
  - On blacklist: set blacklisted_at, blacklist_until (+6 months) and blacklisted_by, and flag the candidate's open applications.
  - On profile update: recompute `profile_completed_at`.
- **InterviewRoundObserver:**
  - On create, update or delete: dispatch `SyncInterviewToGoogleCalendar` (queued).
  - When the status becomes `not_selected`: set the application result to `not_selected`.
- **Content observers:** bust the website content cache on any change.

### 4.6 Factories and seeders
- Factories for every model, with useful states: `JobPosting::published()`, `->closed()`, `->internship()`, `->closingSoon()`; `Candidate::blacklisted()`, `->quickApply()`, `->complete()`; `Application::shortlisted()`, `->rejectedAfterShortlist()`, `->general()`; `InterviewRound::passed()`, `->syncFailed()`.
- Seeders (`DatabaseSeeder` calls them in this order):
  1. RolesAndPermissions
  2. Admin + HR users
  3. Entities (the four, with placeholder themes)
  4. Departments, then Teams
  5. Skills (about 60 common tech, data and medical skills)
  6. JobPostings
  7. Candidates + Applications + InterviewRounds + Notes
  8. TalentMembers
  9. WebsiteContent
  10. NotificationPreferences

  Use realistic Indian names and cities. Seeders must be **idempotent** (`updateOrCreate`) so `db:seed` can be re-run safely.

### 4.7 Permissions (spatie, seeded)
Permissions:
- `jobs.view`, `jobs.manage`, `jobs.publish`
- `candidates.view`, `candidates.update`, `candidates.notes`, `candidates.blacklist`, `candidates.export`, `candidates.resume`
- `applications.view`, `applications.update`
- `interviews.view`, `interviews.manage`
- `talent.view`, `talent.export`, `campaigns.send`
- `content.manage`, `reports.view`
- `settings.users`, `settings.lists`, `audit.view`, `blocks.override`

Roles:
- **Admin** has every permission.
- **HR** has every permission except `settings.users`, `settings.lists` and `audit.view`.

Admin can change which permissions each role has from the permissions matrix (HA-02).

## 4A. API endpoints (`routes/api.php`, prefix `/api/v1`)
Each endpoint has a Controller (thin) → Form Request → Service/Action → API Resource. Lists return `{ data, meta: { total, per_page, current_page, last_page }, counts: {...} }`, where `counts` holds the per-filter facet counts shown in the UI (CI-07). Errors use one JSON shape: `{ message, errors?, code? }`.

**Public (no auth, rate-limited)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/public/meta` | Enum options, departments, teams, skills, locations |
| GET | `/public/entities` | Entities with themes |
| GET | `/public/content` | All published landing page content (cached, ETag) |
| GET | `/public/jobs` | Search, filters, sort, cursor pagination, facet counts |
| GET | `/public/jobs/{publicId}` | Job detail |
| POST | `/public/quick-apply` | Quick apply (multipart, Turnstile + honeypot) |
| POST | `/public/talent-community` | Short sign-up form |
| GET | `/public/unsubscribe/{token}` · POST `/public/unsubscribe/{token}` · POST `/public/resubscribe/{token}` | Signed unsubscribe flow |
| GET | `/auth/google/redirect` · `/auth/google/callback` | Candidate Google OAuth |

**Candidate (`auth:candidate`)**

| Method | Path | Purpose |
|---|---|---|
| GET / POST | `/candidate/me` · `/candidate/logout` | Session |
| GET / PUT | `/candidate/profile` | Read / update profile |
| POST | `/candidate/profile/resume` · GET `/candidate/profile/resume` | Upload / download own resume |
| GET | `/candidate/jobs/{publicId}/eligibility` | Reason code + `until` |
| POST | `/candidate/jobs/{publicId}/apply` | Submit application (with "save to profile" flag) |
| GET | `/candidate/applications` | My Applications with filters |
| PUT | `/candidate/subscription` | Talent community on/off |

**HR (`auth:web`, permission middleware + Policies)**

| Area | Endpoints |
|---|---|
| Auth | POST `/hr/login`, `/hr/logout`, `/hr/two-factor/challenge`, `/hr/forgot-password`, `/hr/reset-password`; GET `/hr/me` |
| Dashboard | GET `/hr/dashboard/stats`, `/hr/dashboard/pipeline`, `/hr/dashboard/applications-over-time?range=1m\|3m\|6m\|1y`, `/hr/dashboard/sources`, `/hr/dashboard/upcoming-interviews`, `/hr/dashboard/recent-candidates`, `/hr/dashboard/action-items` |
| Search | GET `/hr/search?q=` (grouped results for the command palette) |
| Jobs | `apiResource /hr/job-postings`; POST `/{id}/publish`, `/{id}/unpublish`, `/{id}/close`, `/{id}/extend`, `/{id}/duplicate`; POST `/hr/job-postings/bulk` |
| Candidates | GET `/hr/candidates`, `/hr/candidates/{id}`; PATCH `/{id}` (colour tag); POST `/{id}/notes`; POST/DELETE `/{id}/blacklist`; POST `/{id}/role-blocks/{block}/override`; GET `/{id}/resume` (signed URL); GET `/{id}/activity` |
| Applications | GET `/hr/applications`; PATCH `/{id}/status`; POST `/hr/applications/bulk-status`; POST `/{id}/undo-status`; POST `/{id}/assign-job`; PATCH `/{id}/result` |
| Interviews | GET `/hr/interviews` (list + `?view=calendar&from&to`); POST `/hr/applications/{id}/rounds`; PUT/DELETE `/hr/rounds/{id}`; PATCH `/hr/rounds/{id}/status`; POST `/hr/rounds/{id}/retry-sync` |
| Talent | GET `/hr/talent-members`; GET/POST `/hr/campaigns`; POST `/hr/campaigns/preview`; POST `/hr/campaigns/{id}/send`; GET `/hr/campaigns/{id}` (progress) |
| Exports | POST `/hr/exports` (type + current filters); GET `/hr/exports`; GET `/hr/exports/{id}/download` |
| Notifications | GET `/hr/notifications`, `/hr/notifications/unread-count`; POST `/{id}/read`, `/read-all`; GET/PUT `/hr/notification-preferences` |
| Saved filters | `apiResource /hr/saved-filters` |
| Content | `apiResource` for about-blocks, interview-steps, employee-stories, recruitment-drives, faqs, recognitions, media-items; POST `/{resource}/reorder`; GET/PUT `/hr/site-settings/{key}`; PUT `/hr/entities/{id}` |
| Settings | `apiResource /hr/users` (+ `/{id}/reset-2fa`, `/{id}/toggle-active`); GET/PUT `/hr/roles-permissions`; `apiResource` departments, teams, skills; GET `/hr/system/health` (queue, failed jobs, integrations); POST `/hr/system/test/{integration}` |
| Reports & audit | GET `/hr/reports/{report}`; GET `/hr/audit-logs` |

### 4A.1 Backend folder structure (`career-backend`)
```
app/Enums  app/Models  app/Observers  app/Policies  app/Events  app/Listeners
app/Http/Controllers/{Public,Candidate,Hr}  app/Http/Requests/{Public,Candidate,Hr}
app/Http/Resources  app/Http/Middleware (SecurityHeaders, EnsureUserIsActive)
app/Services (ApplicationEligibilityService, ApplicationService, QuickApplyService,
              JobPostingService, CandidateService, InterviewService, GoogleCalendarService,
              CampaignService, DashboardService, ReportService, ContentService, FileStorageService)
app/Filters (one Filter class per list: JobPostingFilter, CandidateFilter, ApplicationFilter, …)
app/Jobs (SendCampaignBatch, GenerateExport, SyncInterviewToGoogleCalendar, ProcessUploadedImage)
app/Notifications  app/Mail  app/Exports  app/Support (HasPublicId, Auditable traits)
```

### 4A.2 Frontend folder structure (inside `career-frontend/src/careers` and `src/portal`)
```
main.jsx  App.jsx  routes.jsx (lazy routes)
layouts/        (careers: PublicLayout, AccountLayout | portal: PortalLayout, AuthLayout)
pages/<area>/   (one folder per page; page = composition of shared components)
features/<area>/ (api.js with TanStack Query hooks, components specific to that area)
assets/images/  content/ (fallback copy)
```
Shared code lives only in `src/shared`; `careers` and `portal` never import from each other.

## 5. Careers website (`career-frontend/src/careers`, served at port 5173)

### 5.1 Landing page (`/`): nine sections, in this exact order (Guide v2)
All text and images come from the website content API (section 6.9), so HR can update them without a deploy. The API response is cached and served with an ETag.

1. **Top navigation bar.** Group logo + "Careers" label on the left. On the right: **Job Search** (`/jobs`), **Internship** (`/jobs?level=internship`) and a **Sign in** pill button (Google). When signed in, Sign in is replaced by an avatar menu: My Profile, My Applications, Sign out. Sticky with a white background and a light shadow on scroll. On mobile it collapses to a hamburger (`Bars3Icon`) that opens a slide-over menu.
2. **Opening banner.** Navy background, the group motto / key words as a large heading, the short company line beneath it, a banner image or graphic that matches the website theme, and an orange **Job Search** pill button straight after the text. The banner image is the LCP element: preload it and serve it responsive (WebP/AVIF, srcset). **Company numbers (LP-06):** an optional strip of 3 animated counters at the bottom of the hero (employees, years in business, clients served). It is hidden when HR leaves the numbers empty.
3. **Our entities.** Section title "Our entities". Four `EntityCard`s (Infolks, Webfolks, Dataways, Medrays), each with the logo, name, motto, a 2–3 line description and **View roles** (`/jobs?entity=<slug>`), styled in that entity's theme colours and pattern. Grid: 4 columns at lg, 2 at sm, 1 on mobile.
4. **About the group.** Title, a short intro, then three cards: **How we work**, **What we provide**, **Our culture**. Each has a Heroicon in a circle, a title and body text. 3 columns at md and up, stacked on mobile.
5. **Interview process.** Title "Our interview procedure". A horizontal `Stepper` of HR-defined steps (the number of steps can vary), each with a number circle, a name and 1–2 lines of description. It becomes vertical on mobile.
6. **Life at the group.** Title, then two panels side by side (stacked on mobile):
   - **Employee experiences:** cards with photo (round avatar), name, role and entity, and a short quote. Show only stories with publish permission confirmed and published. On mobile it becomes a swipeable carousel.
   - **Recruitment drives:** a photo grid (3 columns, 2 on mobile), each photo with the drive name, date and caption. Clicking a photo opens a lightbox `Modal`. Images are lazy loaded.
   - **Videos and extracurricular activities (LP-08):** an optional third tab, "Videos & activities". It uses YouTube "lite" embeds (thumbnail first; the player loads on click) and activity photo cards. It is hidden when HR has added none.
7. **Quick apply.** Lets a visitor apply **without choosing a job** and creates their profile at the same time. The two-column form follows the guide picture and becomes one column on mobile:

   | Field | Type | Rules |
   |---|---|---|
   | Full name | text | required, 2–100 chars |
   | Date of birth | `DateInput` | required, dd-mm-yyyy, valid past date, age 16–70 |
   | Email ID | email | required, valid email |
   | Phone number | `PhoneInput` | required, valid for the selected country |
   | Highest qualification | text | required |
   | Location | text | required, placeholder "City or town" |
   | Department | `Select` | required, options from `departments` (HR-maintained) |
   | Resume | `FileUpload` | required, PDF or DOCX, max 5 MB |
   | Keep me updated about new roles | checkbox | optional; adds them to the talent community |
   | Privacy consent | checkbox | required; links to the privacy policy |
   | **Submit application** | full-width bright blue button | shows a loading state and is disabled while sending |

   Behaviour:
   - It creates (or finds, by email) the candidate and creates a `general` application for that department, with source `quick_apply`.
   - **If the email already belongs to a Google-signed-in profile**, keep the existing profile unchanged, still record the general application, and show: "You already have a profile. Sign in with Google to update it."
   - Eligibility rules apply (blacklist; one open general application per department).
   - Spam protection: a honeypot field, rate limiting, and **Cloudflare Turnstile** (invisible).
   - On success, show an inline success panel (Heroicons `CheckCircleIcon`) with HR's confirmation text, a success toast, and a queued confirmation email.
   - When the person later signs in with Google using the same email, link the records automatically.

   **Join the talent community (TC-02, LP-07).** Next to the Quick apply form (a narrow side card on desktop, below the form on mobile), show a short form for people who only want job alerts: **Name, Email, Phone** + privacy consent + "Join". It needs no sign-in and creates a `talent_member` with source `signup_form`. It is protected by honeypot, rate limit and Turnstile. Messages: success ("You're in! We'll email you about new openings."), already a member, re-subscribed.
8. **FAQs.** Title "Frequently asked questions". An `Accordion` of published FAQs in HR's order. Selecting a question opens it; selecting it again closes it. The `+` / `−` icons are on the right and only one item is open at a time. Add FAQPage JSON-LD for SEO.
9. **Footer.** First a white section, "Our recognitions and validations", with badge images (name and year in a tooltip, optional link). Then the navy footer: logo; links to Careers, Job Search, Internship and Contact; round social icons (Instagram, Facebook, LinkedIn, YouTube and any others in settings); and a centred copyright line.

### 5.2 Job search (`/jobs`): JS-01 to JS-10
- Shows only `published` jobs whose last date to apply has not passed.
- One debounced `SearchInput` (role, skill or entity), using a MySQL FULLTEXT search on the server.
- **Filters:** entity, department, team, level (Internship / All level), location, skills (`MultiSelect` type-ahead), date posted (last 24 h / 7 d / 30 d) and closing soon (within 7 days).
- **Sort:** newest, closing soonest, title A–Z.
- Filters live in the URL (shareable and back-button friendly) and show as `FilterChips` with "Clear all", plus a live **result count**. On mobile, filters open in a `SlideOver` with an "Apply filters (n)" button.
- `JobCard` shows title, `EntityBadge`, department/team, level, location, posting date and days left. It uses the entity's theme accent and logo. Hovering a card prefetches its detail.
- `Skeleton` cards while loading, an `EmptyState` with a "Clear filters" action, and "Load more" (cursor pagination).

### 5.3 Job detail (`/jobs/:slug-:id`): JD-01 to JD-07
- One template, themed by entity: title, entity badge and logo, motto, department/team, level, location, posting date, last date to apply (with a "Closes in n days" badge), role summary, qualification, skills as tags, experience, why join us, and the interview process `Stepper`.
- A sticky **Apply** bar on mobile and a sticky side card on desktop:
  - Not signed in: Google sign-in, then return to the apply form for this job.
  - Signed in: go to the apply form.
  - Not eligible: show a polite reason instead of the button (already applied, role block until a date, blacklisted, deadline passed, job closed).
- A share button (copy link, with a toast "Link copied"). Add JobPosting JSON-LD and Open Graph tags.

### 5.4 Account: PR-01 to PR-08
- Google is the only sign-in. On the first sign-in: create the candidate, add them to the talent community, link any Quick apply record with the same email, and redirect to **Complete your profile**. Show a dismissible banner on every page until the profile is complete.
- `/profile`: all profile fields (the job application fields plus date of birth, highest qualification and preferred department), resume replace with preview, and a profile completeness `ProgressBar`. There is no delete option.
- `/my-applications`: cards or a table with entity, role (or "General application – <Department>"), applied date and a candidate-friendly status (Applied, In review, Shortlisted, Interview scheduled, Closed). Filters: status, entity, date.
- `/settings/notifications`: talent community subscription on/off.

### 5.5 Job application form (`/jobs/:id/apply`): AF-01 to AF-03
It uses the same form pattern and components as Quick apply.

| Field | Rule |
|---|---|
| Name | required |
| Email | from Google, read-only |
| Phone | required, `PhoneInput`, validated |
| Location | required, "City, Country" |
| Gender | required: Male / Female / Other |
| Years of experience | required, ≥ 0 |
| Current CTC | required, ≥ 0 |
| Expected CTC | required, ≥ 0 |
| Reference ID | optional, free text, not validated against any list |
| Resume | required, PDF/DOCX, max 5 MB (pre-filled from the profile, replaceable) |
| LinkedIn URL | optional, valid URL |
| Portfolio URL | optional, valid URL |

- The form is pre-filled from the profile, with a "Save these changes to my profile" checkbox.
- The same Zod schema validates on the client and a Form Request validates on the server, with specific inline messages. Scroll to the first error and focus it.
- Source is `referral` if a Reference ID is entered, `job_alert` if `?src=alert`, and `career_website` otherwise.
- On success: a confirmation page, a toast, and a queued confirmation email that names the role and the entity.
- Unsaved changes trigger a "Leave this page?" confirmation.

### 5.6 Talent community: TC-01 to TC-05
- Members join by Google sign-in (TC-01, PR-06), through the short sign-up form on the landing page (TC-02), or by ticking the Quick apply checkbox.
- Members receive job alerts and company updates by email (TC-03).
- Every community email has a one-click unsubscribe link (`/unsubscribe/:token`, signed) and a `List-Unsubscribe` header. The unsubscribe page offers re-subscribe.
- Unsubscribing stops job alerts and updates only. Application confirmations are always sent.

---

## 6. HR recruitment portal (`career-frontend/src/portal`, served at port 5174)

### 6.1 Look and layout: the reference design
- Follows section 3.2 exactly: a **blue gradient sidebar** with the Infolks Group logo, white Heroicon nav items, the glowing active pill and the illustration footer. It collapses to icons only on desktop (with tooltips) and becomes an off-canvas `SlideOver` on mobile and tablet.
- The **top bar** has:
  - A rounded global search pill that searches candidates, jobs and applications by name, email, phone or title. `⌘K` / `Ctrl+K` opens it as a command palette with results grouped by type.
  - The `NotificationBell` with a red count badge.
  - The avatar with name and role, opening a menu (profile, 2FA, notification preferences, sign out).
- Content sits on the light blue background with soft blobs, in white rounded-2xl cards with soft blue shadows. Every page opens with a `PageHeader` that has a title, subtitle and gradient primary + outlined secondary pill buttons.
- **Fully responsive.** Stat cards go 4 → 2 → 1 columns, the pipeline scrolls horizontally on mobile with snap, tables become stacked cards below md, and every action stays reachable on a phone.
- Sidebar items (Heroicons):

  | Item | Icon | Access |
  |---|---|---|
  | Dashboard | `HomeIcon` | all |
  | Jobs | `BriefcaseIcon` | all |
  | Candidates | `UsersIcon` | all |
  | Applications | `DocumentTextIcon` | all |
  | Interviews | `CalendarDaysIcon` | all |
  | Talent Community | `MegaphoneIcon` | all |
  | Website Content | `PaintBrushIcon` | all |
  | Reports | `ChartBarIcon` | all |
  | Settings | `Cog6ToothIcon` | Admin only |
  | Audit Log | `ShieldCheckIcon` | Admin only |

### 6.2 Access: HA-01 to HA-04
- A separate login page in the same design (email, password, show/hide `EyeIcon`, remember me, forgot password, 2FA step).
- **Roles:**
  - **Admin:** everything, plus HR users, roles, departments/teams/skills, entities' content and the audit log.
  - **HR:** jobs, candidates, applications, interviews, campaigns and website content.
- Granular permissions (e.g. `candidates.export`, `candidates.blacklist`, `content.manage`) are checked by Policies and hidden in the UI when not allowed.
- All users see all four entities and narrow the view with filters.

### 6.3 Dashboard ("Career Overview", built like the reference image)
1. **Header:** "Career Overview" + "Welcome back, {first name}! …", a global entity filter (All / Infolks / Webfolks / Dataways / Medrays) and a date range. The buttons are **Post a Job** (gradient, `PaperAirplaneIcon`) and **Send Job Alert** (outlined, `PlusIcon`).
2. **Four stat cards** (count-up + sparkline + trend vs the previous period):

   | Card | Icon |
   |---|---|
   | Active openings | `BriefcaseIcon` |
   | Total applicants | `UserGroupIcon` |
   | Shortlisted | `StarIcon` |
   | Interviews this week | `CalendarDaysIcon` |

   Under them, a slim row of "needs action" chips: new applications since your last login, new today, quick-apply awaiting review, interviews **today**, jobs closing in 7 days, calendar sync failures. Each chip links to its filtered list.
3. **Hiring pipeline:** tiles for Applied → Under review → Shortlisted → Interview → **Selected** with counts, plus small "Rejected" and "Not selected" counts. Clicking a tile opens Applications filtered to that stage. "View details →" links to Reports.
4. **Applications over time:** a gradient area chart with 1M / 3M / 6M / 1Y toggles and a tooltip pill. It can be split by entity using legend toggles.
5. **Upcoming interviews:** the next 5 rounds, each with an avatar, name, role, date/time and round status pill, plus "View all →".
6. **Top hiring sources:** a donut of Career website / Job alert / Referral / Quick apply, with the main share in the centre.
7. **Recent candidates:** a table with avatar, name, applied role, entity badge, experience, application date, status pill and a kebab menu (View profile, Change status, Add note, Download resume), plus "View all candidates →".
8. **Promo card:** "Grow your career with Infolks Group – Innovate • Learn • Belong", with a team photo and an "Open careers site" button that opens the public site in a new tab.

All widgets load in parallel and each has its own skeleton, so one slow query never blocks the page. Dashboard numbers are cached for 60 seconds.

### 6.4 Jobs
- Create, edit, publish, unpublish, close, extend the last date, duplicate (keeps the role_key) and "Preview as candidate".
- The form is split into sections (Basics, Description, Skills, Dates & status), with autosave as a draft and validation on publish.
- **List filters:** search, entity, department, team, level, location, status, skills, created by, posted date range, last-date range, closing within n days, has applications.
- Columns: title, entity, department, level, status, applications count (links to the filtered list), posted, closes. Bulk actions: close, publish, unpublish.

### 6.5 Candidates
- **List filters:** search (name/email/phone), entity applied to, job/role, department, gender, age range (from date of birth), location, highest qualification, years of experience range, expected CTC range, signup source (Google / Quick apply), colour tag, blacklisted, has referral, has active role block, application status, applied date range, profile complete.
- **Candidate page:** profile details, inline resume preview (PDF in an iframe from a signed URL, DOCX download), links, and tabs for Applications, Interviews, Notes (`Timeline` with author and date), Blocks & blacklist, and Activity (audit trail).
- **Actions:** add note, set colour tag (Contacted / Not contacted), blacklist / remove blacklist (reason + `ConfirmDialog`), override role block (reason required), and download resume.
- **Export** the current filtered list to Excel (queued, with a notification when ready). The visible **result count** updates with every filter (CI-07, CI-08).

### 6.6 Applications
- **Tabs:** All, Job applications, General (Quick apply). Each tab shows its count.
- **Filters:** search, type, entity, job/role, department, level, source, referred, status, result, applied date range, has interview, blacklisted candidate (flagged).
- Each row shows the tags: entity, role, level, source and referred (CI-02).
- The status flow is Applied → Under review → Shortlisted / Rejected. Change status inline or in bulk, with an optimistic update, a toast and an **Undo** option for 5 seconds.
- Status changes **never email the candidate**.
- A general application can be **assigned to a job**, which converts it to a job application and keeps its history.

### 6.7 Interviews
- List and calendar views (week/day) of shortlisted applications with their rounds.
- **Filters:** date range, entity, job/role, interviewer, mode, round status, calendar sync status.
- Schedule or reschedule a round in a `SlideOver` (date, time, duration, mode, location or link, interviewer). This creates or updates the Google Calendar event. If sync fails, the round is saved with a "Sync failed" badge, a **Retry** button and an in-app notification.
- Round status: Scheduled, Completed, Passed, Not selected. When all rounds have passed, HR can mark the candidate **Selected** (no Joined status; HRMS is handled manually). A "Not selected" round sets the result to Not selected and triggers the role-block rule (CI-05, CI-06).

### 6.8 Talent community
- **Members list filters:** search, source, subscribed, linked to a candidate, joined date range. Export is available.
- **Campaigns:** a step-by-step composer:
  1. Choose the type: job alert (pick published jobs) or company update (subject and rich text).
  2. Preview the email on desktop and mobile.
  3. Recipient count (subscribed members only).
  4. Confirm and send.
- Sending is queued in batches, with live progress and a notification when done.
- Campaign history shows sent/failed counts from `email_logs`.

### 6.9 Website content (CMS for the landing page)
Simple forms using the shared components, each list with drag-to-reorder, a publish toggle and a live **Preview** link:
- Hero (motto, company line, banner image, company numbers), Videos & activities, About intro + three blocks (pick a Heroicon by name from a searchable picker), and Interview steps (add, remove, reorder).
- Employee stories (the publish-permission checkbox must be ticked before a story can be published), Recruitment drives (multi-photo upload, resized and converted to WebP on the server), FAQs (add, edit, remove, reorder; rich-text answers), Recognitions (badge, name, year, link), Social links and copyright, Departments list (also under Settings), and Entity cards (motto, description, colours, logo, pattern).
- Every change clears the public content cache and is written to the audit log.

### 6.10 Settings (Admin) and Reports
- **Settings:** HR users (invite by email, activate/deactivate, reset 2FA, assign role), roles and permissions matrix, departments, teams, skills, notification defaults, and integrations status (Google OAuth, Google Calendar, mail, Turnstile), each with a "Test connection" button.
- **Reports:** applications by entity, department, source and referral; time-to-shortlist; selections per entity. All are filterable by date range and exportable.

### 6.11 Common list behaviour (every portal list)
- Server-side search, filters, sorting and pagination (25 / 50 / 100 per page).
- Filters are kept in the URL and shown as `FilterChips`, with a visible **result count**.
- **Saved filters:** name a filter set, mark one as default, and share it with the team.
- Column visibility toggle, remembered per user. Row selection with bulk actions. A keyboard shortcut `/` focuses search.
- `Skeleton` rows while loading, plus `EmptyState` and `ErrorState` with retry.

---

## 7. Notifications

### 7.1 In-app toasts (both apps)
Use the shared `ToastProvider` (top-right on desktop, bottom on mobile; success / error / warning / info; auto-dismiss; `aria-live`) for every create, update, delete, upload, copy, export and error result. Never show a raw server error: map it to a friendly message.

### 7.2 HR notification centre (portal)
- Laravel database notifications are shown in a `NotificationBell` with an unread count badge and a dropdown of the latest notifications. There is also a full `/notifications` page with filters (type, read/unread, date), "Mark all as read", and a link from each item to the related record.
- Delivery: poll every 30 seconds with TanStack Query (and refetch on window focus). Real-time broadcasting with **Laravel Reverb** is optional through an env flag.
- Each user sets per-type preferences for in-app and email.

| Event | Who is notified |
|---|---|
| New job application | all HR (in-app) |
| New Quick apply application | all HR (in-app) |
| Application from a referred candidate | all HR (in-app) |
| Blacklisted or role-blocked candidate tried to apply | Admin (in-app) |
| Interview reminder (60 min before) | the HR user who scheduled it (in-app + email) |
| Google Calendar sync failed | the scheduler of the interview (in-app) |
| Job closes in 3 days / job auto-closed | job creator (in-app) |
| Export ready to download | requester (in-app; the link expires in 24 h) |
| Campaign sent / campaign failed | sender (in-app) |
| New HR user added, role changed, 2FA reset | Admin (in-app) |
| Daily digest (applications yesterday, interviews today) | opted-in HR (email) |

### 7.3 Candidate notices (careers site)
- Toasts for actions.
- Banners: incomplete profile; job closing soon on a job they viewed but did not apply to (optional); "Your application was received".
- **Emails to candidates are limited to:** application confirmation (job and Quick apply) and talent community emails. No interview, offer, rejection or status-change emails.

---

## 8. Business rules (one `ApplicationEligibilityService`, fully tested)

1. **AR-01** A candidate can apply to a given job only once (unique index + service check).
2. **AR-02** A new opening for a similar role is a new job record, so the candidate can apply to it.
3. **AR-03** If an application is rejected **after shortlisting** (Rejected after Shortlisted, or result Not selected), create a `role_block` on that `role_key` for 6 months. Other roles remain open.
4. **AR-04** A blacklisted candidate cannot apply to anything (any entity, job or general) for 6 months. Existing applications are flagged in the portal.
5. **AR-05** The website shows a clear, polite message. Blocks lift automatically when the date passes (scheduled job + check at apply time). HR can override any block (reason required, audited).
6. **AR-06** No applications after the last date to apply, or on draft or closed jobs.
7. **General applications:** one open general application per candidate per department. A new one is allowed after the previous one is closed or after 6 months.
8. Candidates, profiles and applications are never deleted.
9. Status changes send no candidate emails.

The service returns a reason code (`already_applied`, `role_blocked`, `blacklisted`, `deadline_passed`, `job_not_open`, `general_already_open`) and, where relevant, `until` (date), so both apps can show the right message.

---

## 9. Emails
- Queued Markdown mailables with the Infolks Group header (navy band, logo), mobile-friendly, and a plain-text version. Every send is logged in `email_logs`.
- **Candidate emails:** application confirmation (job), application confirmation (Quick apply), job alert, and company update (both with unsubscribe).
- **HR emails:** password reset, invitation, interview reminder, and daily digest.
- Use the `log` mailer (or Mailtrap) in development and SMTP/SES in production. Set up SPF, DKIM and DMARC; document this in the README.

---

## 10. Security (OWASP Top 10 baseline: implement all of it)

### Authentication and sessions
- Sanctum SPA cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, CSRF on all state-changing requests. Session ID regenerated on login.
- Idle timeout: 30 min in the portal, 7 days on the careers site.
- HR passwords: at least 10 characters, checked against breached passwords (`Password::uncompromised()`), bcrypt/argon2.
- Login throttling and lockout after 5 failed attempts. TOTP 2FA is mandatory for Admin and optional for HR. New-device login alert email.
- Google OAuth uses a `state` check, and only verified Google emails are accepted.

### Authorisation
- A Policy on every model, plus permission middleware on every HR route.
- Candidates can access only their own records (no IDOR). Use UUIDs or hashids in public URLs instead of sequential IDs.

### Input and output
- A Form Request on every endpoint. Use `$fillable` (no mass assignment). Eloquent and query bindings only (no raw string SQL).
- Rich text is sanitised on save (HTML Purifier allow-list) and rendered with a sanitiser on the frontend. `dangerouslySetInnerHTML` is used nowhere except for sanitised content.

### Files
- Resumes and photos are validated by real MIME type and extension (PDF/DOCX ≤ 5 MB; images ≤ 3 MB) and stored with random names on a **private** disk.
- Resumes are served only through an authorised endpoint or a 5-minute signed URL, with `Content-Disposition` and `X-Content-Type-Options: nosniff`.
- Optional ClamAV scan through a queued job. Images are re-encoded on the server, which also strips EXIF data.

### Abuse protection
- Rate limits on: OAuth callback, Quick apply, job apply, login, search, unsubscribe and export.
- Turnstile + honeypot on Quick apply.

### HTTP security headers
CSP (strict, nonce-based, only the required origins), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. CORS allows only the two app origins.

### Data protection
- Privacy consent is recorded with a timestamp, in line with India's DPDP Act. Personal data (date of birth, phone, CTC) never appears in logs.
- Encrypted backups. `APP_DEBUG=false` in production. Secrets only in env files.
- Candidate data export on request (Admin action).

### Auditing
- The audit log covers logins, blacklisting, block overrides, status changes, job publishing/closing, exports, content changes, and user and role changes.
- The Admin can view and filter it.

### Dependencies and CI
`composer audit` + `npm audit` in CI, Dependabot, and Larastan + ESLint security rules.

---

## 11. Performance (fast system)

### Frontend
- Targets: **Lighthouse ≥ 90** (performance, accessibility, best practices, SEO) on mobile; LCP < 2.5 s; CLS < 0.1; INP < 200 ms.
- Route-level code splitting; heavy pieces (charts, rich text editor, calendar view, lightbox) lazy loaded.
- Vite production build with brotli/gzip, hashed assets and long-cache headers.
- Tree-shaken Heroicons imports (per icon, never the whole set).
- Motion: Framer Motion via `LazyMotion` (`domAnimation` only), loaded with the first route. Animate only `transform` and `opacity`; no animation libraries other than Framer Motion. Recharts is loaded only on the dashboard and report routes. Sparklines are plain SVG.
- Decorative SVG blobs are inline and `aria-hidden`; no large background images.
- Images: WebP/AVIF, `srcset` and `sizes`, `loading="lazy"` below the fold, fixed aspect ratios to avoid layout shift. The hero image is preloaded. Fonts are self-hosted and preloaded.
- TanStack Query: sensible `staleTime` (content 10 min, jobs 1 min); prefetch on hover and on route intent; optimistic updates in the portal; `keepPreviousData` for filters and paging so tables don't flash.
- Debounced search (300 ms); cancelled in-flight requests.
- Pre-render (or SSG) the landing page and job detail pages for SEO and first paint (e.g. `vite-plugin-ssr` / `vike`, or a simple pre-render step). Also generate `sitemap.xml` and `robots.txt`.

### Backend
- Indexes on every filter, sort and foreign key column; FULLTEXT index for job search.
- Eager loading everywhere; enable `Model::preventLazyLoading()` in development. Select only the needed columns.
- Cache (database driver by default, Redis in production) for: entities, content, departments, skills, and public job list pages. Use **versioned cache keys** (e.g. `jobs:v{n}:…`, bumping `n` on write) so invalidation works on any driver.
- Cursor pagination for public lists; standard pagination for portal tables.
- Heavy work (emails, exports, image processing, calendar, campaigns) always runs on queues.
- Production runs `php artisan optimize` with OPcache on. Laravel Octane is optional.
- API responses compressed (gzip/brotli at nginx), with ETags on public GET endpoints.
- Target p95 API response time < 200 ms for list endpoints with the seeded data × 50.

---

## 12. Responsive behaviour (mobile-first)
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Test at 360, 768, 1024 and 1440.
- **Careers site:**
  - Nav collapses to a hamburger slide-over. Entity cards: 4 → 2 → 1 columns. About blocks: 3 → 1. The stepper turns vertical. Life at the group stacks, with stories as a carousel.
  - Quick apply and the application form go to one column. The job filters move into a slide-over, and the job detail Apply bar is sticky at the bottom.
- **Portal:**
  - The sidebar moves into a drawer, tables become cards, and filters move into a slide-over.
  - Bulk actions sit in a bottom action bar, and modals go full screen on small devices.
- Touch targets are at least 44 × 44 px. There is no horizontal scrolling anywhere.

---

## 13. Accessibility and SEO
- WCAG 2.1 AA: semantic landmarks, one `h1` per page, labelled controls, error messages linked with `aria-describedby`, focus trapping in modals, a skip-to-content link, and `prefers-reduced-motion` respected.
- SEO: unique titles and meta descriptions, Open Graph tags, JobPosting and FAQPage JSON-LD, canonical URLs, sitemap.

---

## 14. Testing and quality
- **Backend:** Pest feature tests for all business rules, all policies and permissions, Quick apply (including duplicate email and spam protection), resume access, unsubscribe, notifications dispatch and exports.
- **Frontend:** Vitest + React Testing Library for `src/shared/ui` components and form validation. Playwright end-to-end tests for: landing → job search → apply; Quick apply; HR shortlist → schedule interview → select; campaign send.
- CI (GitHub Actions) runs lint, tests, audits and the build on every push.

---

## 15. Build phases (complete and test each phase before starting the next)
1. **Foundation:** set up `career-backend` (packages, `composer run setup`/`dev`, Sanctum, CORS) and `career-frontend` (two entries + two Vite configs, aliases, `npm run dev`), the Tailwind preset and design tokens, the `src/shared/ui` core components (Button, FormField, inputs, Card, Badge, Modal, SlideOver, Toast, Skeleton, EmptyState), motion presets (`Reveal`, `PageTransition`, `AnimatedNumber`), illustrations and placeholder images, the portal shell (gradient sidebar + top bar) per the reference design, auth (Google + HR with 2FA, two guards), roles and permissions, **all migrations, enums, models with relationships, observers, factories and seeders from section 4**, README.
2. **Jobs:** portal job management, departments/teams/skills, the `DataTable` + `FilterBar` + saved filters, the public job search and detail pages with entity theming.
3. **Candidate flows:** profile, job application form, Quick apply, eligibility service, confirmation emails, My Applications.
4. **HR candidate management:** candidates, applications (job and general), notes, colour tags, blacklist, blocks, queued exports.
5. **Interviews:** rounds, calendar view, Google Calendar sync and retry, Selected / Not selected.
6. **Notifications:** the toast system everywhere, the HR notification centre, preferences, reminders, daily digest.
7. **Talent community and Website content:** campaigns, unsubscribe, the CMS for all landing sections.
8. **Landing page:** all nine sections exactly per the guide (+ the talent community mini-form and the optional videos tab), in the reference style with scroll animations, wired to the CMS; pre-rendering and SEO.
9. **Dashboard and reports:** the Career Overview dashboard matching the reference design (section 6.3) with all animations, plus Reports.
10. **Hardening:** a visual QA against the reference image and the guide, a reduced-motion check, security headers and CSP, a full security review against section 10, a performance pass against section 11, an accessibility audit, responsive QA at all breakpoints, end-to-end tests, and the deployment guide.

At the end of each phase, report: what was built, any assumptions made, and how to run and test it.

---

## 16. Assumptions (keep unless told otherwise)
- "Same role" for the 6-month block means the same `role_key` (normalised title, editable by HR).
- Jobs past their last date disappear from the website automatically; HR can extend the date to reopen them.
- An application stores a snapshot of what was submitted, so later profile edits don't change it.
- Landing page content is editable from the portal's Website Content section. This follows Guide v2, which says FAQs and interview steps come from HR, and it replaces the older "content in code" note.
- The guide's landing page has no talent community section, but TC-02 still requires the short form, so it sits beside Quick apply (section 5.1, item 7).
- Quick apply adds `quick_apply` as a fourth application source, alongside the three in CI-02.
- Departments (the Quick apply list) are a separate HR-maintained list. A team can optionally belong to a department.
- The colour values in section 3 are taken from the guide's example layouts and must be matched to the redesigned Infolks Group website before launch.

---

## 17. Requirements traceability (every ID in the requirements document)
The agent must tick each row when it is built and tested.

| ID(s) | Where in this prompt |
|---|---|
| §1 Scope (jobs flow from portal to site; replaces /career) | 1 |
| §2 Naming, entity tags, entity themes | 1, 3.1, 3.4, 5.2, 5.3 |
| §3 Users (Candidate, Talent member, HR user; no hiring managers or entity users) | 4, 6.2 |
| §4 Steps 1–6 | 5, 6, 9 |
| LP-01 One page for all entities, matches the group site | 3, 5.1 |
| LP-02 Motto + search for role | 5.1 (2) |
| LP-03 Entity tabs/cards | 5.1 (3) |
| LP-04 Interview steps | 5.1 (5) |
| LP-05 Why join us / culture | 5.1 (4) |
| LP-06 Company numbers | 18 |
| LP-07 / TC-02 Short talent sign-up form | 5.1 (7) |
| LP-08 Videos, experiences, activities | 5.1 (6) |
| LP-09 Job Search link | 5.1 (1, 2) |
| LP-10 Fixed content | 18 |
| LP-11 Desktop + mobile | 12 |
| JS-01 – JS-10 | 5.2 |
| JD-01 – JD-07 | 5.3 |
| PR-01 – PR-08 | 5.4, 5.5 |
| Application form fields, AF-01 – AF-03 | 5.5 |
| AR-01 – AR-06 | 8 |
| TC-01 – TC-05 | 5.6, 6.8, 9 |
| HA-01 – HA-04 | 6.2, 6.10 |
| §6.2 Five sections, each with search + filters by job role | 6.3 – 6.7, 6.11 |
| §6.3 Job fields | 4.2 (`job_postings`), 6.4 |
| CI-01 – CI-09 | 6.5 – 6.8 |
| §7 Emails (no status-change, interview, offer or rejection emails) | 7.3, 9 |
| §8 Data to be stored | 4 |
| §9 General (responsive, themes, naming, privacy, resume limits) | 3, 10, 12 |

## 18. Conflicts between the documents and how they are resolved
| Topic | Requirements doc | Guide / reference | Resolution |
|---|---|---|---|
| Landing page sections | LP-02 – LP-08 (7 sections) | Guide v2: 9 sections | Follow the guide's 9 sections. Keep LP-07 (talent form beside Quick apply) and LP-08 (videos tab). |
| Company numbers (LP-06) | Required | Not in the guide | Show an **optional animated counter strip** (employees, years, clients) at the bottom of the hero, editable in Website Content, hidden if empty. **Confirm with HR.** |
| Content editing (LP-10) | Fixed, not editable | Guide: HR must edit FAQs; steps "come from HR" | Website Content CMS (6.9). **Confirm with HR** whether to limit editing to FAQs and interview steps only. |
| Quick apply | Not in requirements | Guide section 7 | Built as a `general` application with source `quick_apply` (5.1). |
| Statuses in the pipeline | Applied, Under review, Shortlisted, Rejected; rounds; Selected | Reference: Screening, Offered, Hired | Use the requirement statuses (3.4). |
| Hiring sources | Career website, Job alert, Referral | Reference: Organic, LinkedIn | Use the requirement sources (+ Quick apply). |
| Parent name in the UI | "Infolks Group" | Reference shows "Infolks" | Always "Infolks Group" for the parent. |

---

## 19. Starter prompts (paste one at a time into any AI coding agent)
After each phase, run the app, check the result, then commit: `git add -A && git commit -m "Phase N: …"`.

1. `Read docs/SPEC.md and AGENTS.md fully. Implement Phase 1 (Foundation) from section 15. The projects already exist: career-backend (fresh Laravel) and career-frontend (fresh React). Do not create new project folders. First inspect both folders: keep the installed Laravel and React versions; if career-frontend uses TypeScript or Create React App, convert it to Vite + plain JavaScript. Set them up per section 2 (career-frontend builds two separate apps from careers.html and portal.html, in plain JavaScript), the Tailwind preset, the core src/shared/ui components, the portal shell, both auth flows, and ALL migrations, enums, models, relationships, observers, factories, seeders and permissions exactly as in section 4. Make sure "composer run setup", "composer run dev" (in career-backend) and "npm run dev" (in career-frontend) work without Docker. Run the migrations and seeders yourself and fix any errors. List anything you could not finish.`
2. `Using docs/SPEC.md, implement Phase 2 (Jobs): sections 4A (job endpoints), 5.2, 5.3, 6.4 and 6.11. Include facet counts, saved filters, entity theming, Pest tests and responsive layouts.`
3. `Using docs/SPEC.md, implement Phase 3 (Candidate flows): sections 5.4, 5.5, 5.1 item 7 (Quick apply + talent form), 8 and 9. ApplicationEligibilityService must have a Pest test for every rule.`
4. `Using docs/SPEC.md, implement Phase 4 (HR candidate management): sections 6.5 and 6.6, queued Excel exports, blacklist and role blocks with audit logs.`
5. `Using docs/SPEC.md, implement Phase 5 (Interviews): section 6.7 with Google Calendar sync, the retry flow and the calendar view.`
6. `Using docs/SPEC.md, implement Phase 6 (Notifications): section 7 in full.`
7. `Using docs/SPEC.md, implement Phase 7 (Talent community + Website content): sections 5.6, 6.8 and 6.9.`
8. `Using docs/SPEC.md and docs/landing-page-guide.pdf, implement Phase 8 (Landing page): section 5.1 with the style, motion and images of sections 3.2–3.6.`
9. `Using docs/SPEC.md and docs/dashboard-reference.png, implement Phase 9: the Career Overview dashboard (section 6.3), matching the reference style with the changes in section 3.4, plus Reports.`
10. `Using docs/SPEC.md, run Phase 10 (Hardening): check every item in sections 10–14 and the traceability table in section 17, fix the gaps, and report the results.`

**Tips that work with every agent**
- If the agent stops partway through a phase, reply: `Continue Phase N from where you stopped. Check docs/SPEC.md for anything still missing.`
- If a phase is too big for one response, split it, for example: `Do Phase 1, part A: career-backend only: packages, auth, migrations, models, seeders.` then `Phase 1, part B: career-frontend setup and shared UI.`
- After each phase, ask: `Compare what you built against the sections of docs/SPEC.md for this phase and list anything missing or different.`
- Start a fresh chat for each phase so the agent's context stays clean. The spec and AGENTS.md carry everything it needs.
