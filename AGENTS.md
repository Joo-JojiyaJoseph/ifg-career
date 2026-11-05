# AGENTS.md: Infolks Group Careers + HR Portal

These rules apply to every task in this repository. The full specification is in `docs/SPEC.md`; read the relevant sections before you change anything.

## Naming
- The parent company is **Infolks Group**. The entities are **Infolks, Webfolks, Dataways, Medrays**.
- Never write "Infolks" when you mean the group: not in UI text, seed data, emails or code labels.

## Stack: do not deviate
- Backend: Laravel (installed version), PHP 8.3, MySQL 8. **No Docker.**
  - Database drivers for cache, queue and session by default; Redis is optional.
- Frontend: React (installed version, 18 or newer) + Vite in **plain JavaScript (.js/.jsx only, no TypeScript)**.
- Layout: `career-backend/` (Laravel API) and `career-frontend/` (one Vite project, **two separate apps**).
  - The careers app: `careers.html` → `src/careers`, `vite.careers.config.js`, port 5173.
  - The HR portal: `portal.html` → `src/portal`, `vite.portal.config.js`, port 5174.
  - Shared code lives only in `src/shared` (alias `@shared`). `careers` and `portal` never import from each other.
  - Never create new top-level project folders.
- Run backend commands inside `career-backend` and frontend commands inside `career-frontend`.
- Styling: **Tailwind CSS only**, using tokens from `src/shared/ui/tailwind.preset.js`. No other CSS frameworks, no inline style objects except CSS variables.
- Icons: **Heroicons only** (`@heroicons/react`), imported per icon. No lucide, react-icons, font-awesome or shadcn/ui.
- UI primitives: Headless UI. Server state: TanStack Query. Forms: React Hook Form + Zod. Tables: TanStack Table. Motion: Framer Motion (LazyMotion). Charts: Recharts (lazy loaded).

## Reuse
- Before writing any UI, check `src/shared/ui`. If a component is missing, add it there with JSDoc + PropTypes and use it from both apps.
- Never duplicate a component, hook, Zod schema or constant inside an app.
- Status colours and labels come only from `StatusBadge` and the enum `label()` / `color()` values served by the API.

## Backend patterns
- Every endpoint uses: a thin Controller, a Form Request, a Service or Action, an API Resource and a Policy.
- Enums are PHP backed enums stored as `string(30)`.
- The job table and model are `job_postings` / `JobPosting`.
- Expose `public_id` (ULID) in URLs and responses, never auto-increment IDs.
- Never add delete routes for candidates or applications.
- Status changes never email candidates.
- All eligibility checks go through `ApplicationEligibilityService`.
- Emails, exports, calendar sync, campaign sends and image processing always run as queued jobs.
- List endpoints return `{ data, meta, counts }` and support server-side search, filters, sort and pagination.
- Eager-load relationships. Never run queries in loops.

## Security (always)
- Validate every input, authorise every action, and sanitise rich text.
- Files go on the private disk and are served only through signed URLs. Never log personal data.
- Rate-limit public endpoints. Use Sanctum SPA cookies; never put tokens in localStorage.

## UX (always)
- Mobile-first and responsive from 320px. Touch targets of at least 44px.
- Every data view has loading (Skeleton), empty (EmptyState) and error (ErrorState + retry) states.
- Every mutation shows a toast.
- Accessible: labels, focus rings, keyboard navigation, `aria-live` for toasts. Respect `prefers-reduced-motion`.
- Animate only transform and opacity, 150–250 ms for UI.

## Workflow
- Work one phase at a time (SPEC section 15).
- After each phase: run the migrations and tests, fix the failures, then summarise what was built, the assumptions made and how to test it.
- Don't invent requirements. If SPEC is unclear, follow section 16/18 or ask.
