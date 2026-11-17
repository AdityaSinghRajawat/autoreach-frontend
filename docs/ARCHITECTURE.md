# AutoReach frontend: architecture and implementation plan

The web app for AutoReach. It talks only to the backend's REST API (`/api/v1`), described by
`openapi/openapi.json`, which is copied from the backend and is the single source of the API's types.

## 1. What the backend offers

| Area         | Endpoints                                                                                                                        | Used by          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Auth         | register (201 session, or 202 when verification is on), login, refresh, logout, verify-email, forgot-password, reset-password    | public pages     |
| Current user | `GET/DELETE /users/me`, `GET /users/me/export`, `PUT /users/me/password`, `POST /users/me/email`, `POST /users/me/email/confirm` | account settings |
| Candidate    | `GET/PATCH /candidates/{id}`, application profile `GET/PUT`                                                                      | profile          |
| Resumes      | upload (multipart, processed in the background), list, get, activate, delete                                                     | resumes          |
| Matching     | matched jobs (paged, `minScore`), job detail                                                                                     | jobs             |
| Contacts     | candidate contacts, contacts for a job, request enrichment                                                                       | jobs, contacts   |
| Outreach     | mailboxes (create, verify, delete), templates, campaigns with steps, messages (create, list, cancel, confirm LinkedIn)           | outreach         |
| Applications | create, list, get, update status                                                                                                 | applications     |
| Dashboard    | metrics, funnel, activity feed (paged) and live stream (server-sent events)                                                      | home             |
| Admin        | job sources (+ poll), API clients, queues and dead tasks (+ retry), providers, suppressions, contact lookup, erasure and signals | admin console    |

Every response uses one envelope: `{ success, statusCode, data, meta, error }`; lists carry `meta`
(`page`, `perPage`, `totalItems`, `totalPages`). Errors carry a stable `code`, a public `message` and,
for 422, field `details`.

## 2. Stack

| Concern       | Choice                                                          | Why                                                                                                 |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Build         | Vite, React, TypeScript (strict)                                | A signed-in SPA in front of a separate API: no server rendering needed, fast builds, static hosting |
| Routing       | React Router (data router) with lazy routes                     | Route-level code splitting, loaders for guards, nested layouts                                      |
| Server state  | TanStack Query                                                  | Caching, background refresh, request de-duplication, optimistic updates, invalidation by key        |
| Client state  | Zustand, only for the session and UI preferences                | Everything else is server state and lives in the query cache                                        |
| API types     | `openapi-typescript` + `openapi-fetch`                          | Types are generated from the backend's spec, so a backend change shows up as a compile error        |
| Forms         | React Hook Form + Zod                                           | Schemas mirror backend validation; 422 `details` map back onto fields                               |
| UI primitives | Radix UI                                                        | Accessible dialogs, menus, tabs, tooltips, selects; styled with our own tokens                      |
| Styling       | Tailwind CSS with CSS-variable design tokens                    | One token set drives light and dark themes                                                          |
| Motion        | Motion                                                          | Spring transitions; everything respects `prefers-reduced-motion`                                    |
| Charts        | Recharts                                                        | The funnel and trend charts                                                                         |
| Icons         | Lucide                                                          | One consistent line icon set                                                                        |
| Fonts         | Self-hosted via Fontsource                                      | No third-party requests, CSP-friendly                                                               |
| Tests         | Vitest + Testing Library + MSW; Playwright for end-to-end       | Components tested against mocked API; key journeys against the real stack                           |
| Quality       | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, CI | Same bar as the backend: lint and tests must pass                                                   |

## 3. Code organisation

Feature folders, each owning its API hooks, components, pages and schemas. Shared code never imports
from a feature.

```
src/
  app/          providers, router, layouts, route guards, error boundaries
  api/          typed client, envelope + error handling, token refresh, query client, SSE reader
  components/
    ui/         design-system primitives (Button, Input, Dialog, Table, Badge, ...)
    layout/     app shell, sidebar, top bar, page header
    feedback/   empty, error and loading states, skeletons
  features/
    auth/ account/ dashboard/ profile/ resumes/ jobs/ contacts/
    outreach/ applications/ admin/
  lib/          formatting, dates, class names, helpers
  styles/       tokens and global styles
  test/         test setup, MSW handlers, fixtures
```

Rules: components are small and typed; data access only through each feature's hooks; query keys
come from one factory per feature; no `any`; no `dangerouslySetInnerHTML`.

## 4. Authentication

- Sign-in returns an access token (15 minutes) and a refresh token (rotating, 30 days).
- The access token lives only in memory. The refresh token is kept in `localStorage` so a reload
  keeps the user signed in; it rotates on every refresh and the backend revokes the whole family if
  one is reused. (Moving it to an httpOnly cookie is a backend change for later; see §10.)
- The API client adds the bearer token, and on a 401 refreshes once (a single shared refresh for
  concurrent requests) and retries; if the refresh fails, the session ends and the user is sent to
  sign-in with the page they were on.
- Route guards: public pages, signed-in pages (candidate) and admin pages (role `ADMIN`).

## 5. Routes

| Path                                                                                                         | Page                                                               |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `/login`, `/register`, `/check-email`                                                                        | sign in, sign up, "check your inbox" after a 202                   |
| `/verify-email`, `/forgot-password`, `/reset-password`                                                       | link landing pages                                                 |
| `/`                                                                                                          | Home: the Reach Path (funnel), metrics, live activity              |
| `/jobs`, `/jobs/:jobId`                                                                                      | matched jobs; job detail with contacts, apply and outreach actions |
| `/applications`, `/applications/:applicationId`                                                              | applications and their prepared answers                            |
| `/outreach`                                                                                                  | messages inbox (filters by status, cancel)                         |
| `/outreach/linkedin`                                                                                         | assisted LinkedIn queue (copy note, open profile, confirm)         |
| `/outreach/campaigns`, `/outreach/templates`                                                                 | campaigns with steps; templates with placeholders                  |
| `/mailboxes`                                                                                                 | connected mailboxes, verify                                        |
| `/contacts`                                                                                                  | contacts discovered for your matches                               |
| `/resumes`                                                                                                   | upload, processing status, activate, delete                        |
| `/profile`                                                                                                   | candidate preferences and the application profile                  |
| `/settings`                                                                                                  | password, email change, data export, delete account                |
| `/settings/email/confirm`                                                                                    | confirms an email change (signed in)                               |
| `/admin`                                                                                                     | console home: queues and providers                                 |
| `/admin/job-sources`, `/admin/api-clients`, `/admin/queues/:queue`, `/admin/suppressions`, `/admin/contacts` | admin tools                                                        |

Every page has loading (skeleton), empty and error states, and works from 360 px wide upward.

## 6. Design system: "Signal"

The product moves a candidate along a path: jobs found, matched, applied, contacts reached,
replies. The interface makes that path the centre of the design.

- **The Reach Path.** The home page shows the funnel as one continuous track with stations;
  live events arrive as pulses along it. The same station markers label statuses everywhere else.
- **Colour.** Cool paper and deep ink as neutrals; one signal blue for actions; one ember orange
  reserved for live and attention states; semantic success, warning and danger. Full dark theme.
- **Type.** Bricolage Grotesque for display, Inter for text, JetBrains Mono for numbers and data.
- **Shape and depth.** Soft 12 px radii on surfaces, hairline borders, elevation only for overlays.
- **Motion.** Short spring transitions on enter and state change; pulses for live data; all off under
  reduced motion.
- **Speed.** A command palette (Ctrl/Cmd + K) jumps to any page or action; keyboard shortcuts for
  the common ones.

Tokens live in `src/styles/index.css` as CSS variables (light and dark) and are exposed to Tailwind
through `@theme`.

## 7. Performance

Every page is its own chunk, and React, TanStack Query, Motion and charts are split into long-lived
vendor chunks. Query cache with stale times per resource; lists are paginated on the server (so no
virtualisation is needed); polling only while background work is in flight; fonts self-hosted and
never inlined. Not done yet: prefetching pages on hover and a bundle-size budget in CI.

## 8. Reliability and security

Error boundaries per route and at the root; API errors normalised to one `ApiError`; toasts for
mutations; no secrets in the bundle (only the API base URL, provided at runtime); strict
Content-Security-Policy and security headers from the production web server; all user-provided text
rendered as text.

## 9. Delivery order

1. Scaffold, tooling, design tokens, UI primitives, API client, auth and app shell.
2. Auth pages and the home page (metrics, Reach Path, live activity).
3. Profile, resumes, matched jobs and job detail.
4. Contacts, mailboxes, templates, campaigns, messages and the LinkedIn queue.
5. Applications.
6. Account settings.
7. Admin console.
8. End-to-end tests, Docker image and CI.

## 10. Backend follow-ups

- Move the refresh token to an httpOnly, SameSite cookie so scripts can never read it.
- Allow the frontend's origin in `CORS_ALLOWED_ORIGINS` for each environment (not needed when nginx
  proxies `/api` on the same origin).
- A request the client cancels is logged as a 500 (`context canceled`); it should be logged quietly
  and not counted as a server error.
- Every page load spends one refresh against the auth rate limit, so very frequent reloads from one
  IP can hit 429. The app now keeps the session and offers a retry instead of signing out.
