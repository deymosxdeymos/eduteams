# EduTeams Fix Plan (Highest → Lowest Priority)

This is a prioritized backlog of correctness, security, performance, and complexity improvements. Each item explains the problem, why it matters, and how to fix it with concrete steps a junior developer can follow. Items marked DONE were implemented in this pass.

1) Protect secrets and prevent accidental leaks [CRITICAL]
- Background: The local `.env` is present for development but is currently ignored by git (good). During this session, secrets were printed when inspecting `.env`. If secrets are ever shown in logs, terminals, or shared beyond your secure environment, treat them as potentially exposed.
- Why it matters: Even if not committed, exposed secrets can be copied and abused (OAuth misuse, DB access). The safest approach is to rotate if exposure is uncertain.
- Best practice: Never commit real secrets. Keep `.env` ignored, provide an `env.example` with placeholders, and avoid logging secrets. Use `NEXT_PUBLIC_` only for non‑secret values intended for the browser.
- Do this:
  1. If any secret may have been exposed outside your secure environment, rotate it (Google OAuth client, `BETTER_AUTH_SECRET`, DB password) and update deployment environments.
  2. Keep `.env` in `.gitignore` (already configured); confirm it’s not tracked: `git ls-files .env` should return nothing.
  3. Add `env.example` with documented placeholders so teammates know which variables are required.
  4. Add a secret scan to CI (e.g., gitleaks) to catch accidental commits of `.env` or credentials in the future.
  5. Grep for accidental logs of secrets: `rg -n "process\.env|GOOGLE_CLIENT|BETTER_AUTH|DATABASE_URL" src` and ensure no values are interpolated into logs or responses.
- Validate:
  - `git ls-files .env` returns nothing; `.env` remains untracked.
  - Running the app works using env vars; no secrets appear in logs.
  - If rotated, old secrets no longer work.

2) Restrict privileged debug/ops endpoints [CRITICAL] — DONE
- Problem: `POST /api/debug/clear-cache` accepted any request and could be abused to evict caches, causing load spikes or stale protection bypass.
- Best practice: Protect operational endpoints behind strong authorization (admin role, internal network, or signed secret), and validate input.
- What was changed: The route requires an admin role via `withRole('admin', …)` and validates the `tag` input. See `src/app/api/debug/clear-cache/route.ts`.
- Validate: Non-admin → 403; admin → 200 and cache is revalidated.

3) Authentication status codes and helper consistency [CRITICAL] — DONE
- Problem: We mixed patterns (some routes threw errors, some returned JSON), and messages/status codes differed (401 vs 500). This breaks clients and tests.
- Best practice: For APIs, return 401 for “not authenticated”, 403 for “authenticated but not authorized”, 404 for “not found or hidden”. Keep error messages consistent and non-revealing.
- What changed:
  - `AuthError` now defaults to “Authentication required”.
  - `withAuth` uses `getCurrentUser()` and returns a 401 JSON response when unauthenticated, instead of throwing a generic 500.
  - `/api/user/onboarding-status` handles unauthenticated flow explicitly and returns a flat JSON payload with `redirectUrl` guidance.
- Follow-up actions:
  - Audit remaining API routes to ensure consistent 401/403/404 usage and messages.
- Validate: Tests expect 401 for unauthenticated and now pass.

4) Personality API: explicit auth/validation/DB semantics [HIGH] — DONE
- Problem: The old handler surfaced wrapper-specific errors and 500s for user mistakes; tests expect 401 for no session, 400 for invalid JSON/DB errors.
- Best practice: Validate input (Zod), parse JSON with try/catch, return 400 on malformed input, and ensure DB errors are mapped to client-safe messages.
- What changed:
  - Route authenticates via `auth.api.getSession` with `next/headers` in prod, a no-op context in tests.
  - On bad JSON → 400 + message; unauthenticated → 401; DB write issues → 400.
  - Scores are computed deterministically; MBTI set only when all questions are answered.
- Validate: Personality tests pass; manual testing returns expected codes/messages.

5) Add security headers (CSP, etc.) [HIGH] — DONE
- Problem: No baseline security headers; this increases XSS/Clickjacking risk.
- Best practice: Set conservative defaults and tune as needed.
- Implement (example in `next.config.ts`):
  - Content-Security-Policy (start Report-Only): default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  - Referrer-Policy: strict-origin-when-cross-origin
  - X-Frame-Options: DENY (or via CSP frame-ancestors 'none')
  - X-Content-Type-Options: nosniff
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
- Steps:
  1. Add these headers via `export async function headers()` (or middleware) for all routes.
  2. Start with `Content-Security-Policy-Report-Only` to gather violations without breaking the app.
  3. Tighten CSP and switch to `Content-Security-Policy` once violations are addressed.
- Validate: Headers visible in responses; no major breakage; eventually no CSP violations in normal flows.

6) Rate limiting for sensitive endpoints [HIGH]
- Problem: Endpoints like join/leave class can be spammed, causing DB load or abuse.
- Best practice: Add per-IP + per-user rate limits. For serverless, use Redis-based ratelimiting (`@upstash/ratelimit`). For a single server, a short-lived in-memory limiter is acceptable.
- Option A (recommended): Upstash Ratelimit
  - Install `@upstash/redis` and `@upstash/ratelimit` (we already use Upstash Redis).
  - Create a shared limiter utility that keys on `ip:userId:endpoint`.
  - Apply to POST endpoints: return 429 with retry-after.
- Option B: In-memory Map with timestamps (only if single VM and non-critical).
- Validate: Bursts trigger 429; normal users unaffected.

7) Prisma over‑fetching → use `_count` and `select` [HIGH]
- Problem: We include full `enrollments` arrays just to count students. This transfers unnecessary data and can slow queries.
- Best practice: Use `_count` or aggregate queries; use `select` to fetch only needed fields.
- Do this:
  - In `/api/courses` and `/api/student/classes`, replace:
    - `include: { enrollments: true }` → `include: { _count: { select: { enrollments: true } } }`
  - Map response to `{ studentCount: course._count.enrollments }`.
  - Update client components (e.g., `Content`) to read the new field.
- Validate: Smaller JSON payloads; queries faster; UI unchanged.

8) Use Next route params instead of manual URL parsing [HIGH]
- Problem: Several routes parse `request.url` and split strings. This is brittle (routing changes break it) and harder to type.
- Best practice: Use Next’s route context `({ params })` in App Router APIs. Our `withAuth` now forwards context, so using params is simple.
- Do this:
  - Change signatures: `export const GET = withAuth(async (_req, { user, params }) => { const { id } = await params; … })`
  - Remove `new URL(request.url)` parsing.
- Validate: Type-check passes; tests green.

9) Consolidate validation schemas [MEDIUM]
- Problem: Two folders: `src/lib/validation` and `src/lib/validations`. This causes confusion and drift.
- Best practice: Keep a single `src/lib/validation` folder. Group schemas by domain (course, personality, assignments) and export from an index if useful.
- Do this:
  1. Move `src/lib/validations/course.ts` → `src/lib/validation/course.ts`.
  2. Update all imports to the new path.
  3. Delete the old `validations` folder.
- Validate: Type-check and tests pass.

10) Server‑first data fetching (reduce SWR where possible) [MEDIUM]
- Problem: Several Client Components (SWR) fetch initial data that could come from Server Components. This increases JS bundle and waterfalls.
- Best practice: Fetch server-side by default; hydrate only interactive parts.
- Do this (example):
  - In dashboard pages, load courses in the page/layout (Server Component) with Prisma.
  - Pass results down to client components as props. Keep SWR for actions like creating/deleting classes to revalidate on demand.
- Validate: Smaller client bundle; fewer requests; same visible data.

11) Logging and observability [MEDIUM]
- Problem: Raw `console.log/error` in API and MBTI manager. No request IDs; noisy logs in prod.
- Best practice: Use a lightweight logger with levels. Do not log PII or secrets. In prod, log warn/error primarily.
- Do this:
  - Introduce a small logger util that no-ops in tests and formats in dev.
  - Replace console calls in APIs and MBTI manager.
- Validate: Cleaner logs; easier debugging.

12) CSRF protection for browser POSTs [MEDIUM]
- Problem: If any POST can be triggered cross-site (e.g., user logged in on our domain), CSRF is possible.
- Best practice: For browser-initiated form submissions, validate Origin/Referer or implement a double-submit token (cookie + hidden form field), and set `SameSite=Lax` or `Strict` for cookies where applicable.
- Do this:
  - Add a small middleware or helper that checks `headers().get('origin')`/`referer` against our base URL for sensitive POST endpoints.
  - For form actions, add an anti-CSRF token with a short TTL in a HttpOnly cookie and verify it server-side.
- Validate: Cross-site POSTs are rejected (403); same-origin flows unaffected.

13) Cache tag hygiene [LOW]
- Problem: Ad hoc tag naming and debug logs may leak internal identifiers.
- Best practice: Centralize tag constants (e.g., `CACHE_TAGS.coursesByDosen(userId)`) and avoid logging tag values in production.
- Do this:
  - Create a tag util; replace string literals.
  - Remove verbose logs or guard by `NODE_ENV !== 'production'`.
- Validate: Predictable invalidation; quieter logs.

14) Minor lint and code hygiene [LOW]
- Issues seen:
  - Biome “organize imports” in `src/components/dashboard/assignment-content.tsx`.
  - A lingering unused type alias (`RoleHandler`).
- Do this:
  - Run `bun run lint` and apply safe fixes: `biome check --apply .`.
  - Remove unused code.
- Validate: Lint passes without blocking issues.

15) CI hardening [LOW]
- Best practice: Automate our checks and block “bad” changes.
- Do this:
  - Add a GitHub Action that runs `bun run type-check`, `bun run lint`, `bun test --bail` on PRs.
  - Add a secret scanner (e.g., gitleaks) and disallow `.env` files.
- Validate: PRs fail if tests, types, or lint fail or if secrets are detected.

Notes on changes already applied
- Admin‑protect cache clear endpoint.
- `withAuth` made context-safe and testable; 401 handling improved.
- Onboarding status API returns a flat payload with stable semantics.
- Personality API reworked for explicit status messaging aligned to tests.

Suggested next steps
- Prioritize and implement P0/P1 items: secrets rotation, security headers, rate limiting, Prisma select/_count, and route params refactors.
- I can follow up with small PRs and tests for each item to keep reviews focused and safe.

Additional explanations (problems only; fixes later)

16) Route params handled inconsistently [HIGH]
- Problem: Several API routes extract identifiers by splitting `request.url` or treat `params` as a Promise shape rather than using Next.js’ route params correctly. This creates brittle parsing logic, makes typing harder, and risks subtle bugs when path structures change or localization/basePath enter the picture.
- Why it matters: Inconsistent param handling leads to hard‑to‑spot 404/403 errors, security oversights (wrong resource fetched/modified), and reduces maintainability. Correct, typed param propagation also simplifies tests and reduces parsing edge cases.

17) Overfetching with Prisma includes [HIGH]
- Problem: Some routes include entire related collections (e.g., `enrollments`) only to count their length, or return more fields than clients need. This increases query cost, memory usage, and payload size unnecessarily.
- Why it matters: Overfetching degrades performance under load and inflates costs. Using targeted selects and `_count` keeps responses lean, improves latency, and reduces the chance of leaking unnecessary data.

18) Error response shape inconsistency [MEDIUM]
- Problem: Handlers mix ad‑hoc `{ error: string }` responses with helper‑generated JSON shapes. Even when status codes are correct, clients see inconsistent envelopes, which complicates error handling and test expectations.
- Why it matters: Uniform error shapes let clients implement one error path, simplify logging/observability, and prevent accidental disclosure in free‑form strings. Inconsistent shapes increase coupling and fragile UI code.

19) Explicit Node.js runtime for Prisma routes [MEDIUM]
- Problem: Some API routes using Prisma declare `runtime = 'nodejs'`, while others omit it. On platforms that default to edge runtimes, this can cause runtime errors or undetected behavior differences.
- Why it matters: Ensuring the correct runtime for all DB‑backed handlers avoids environment‑specific failures and makes deployments predictable across environments.

20) Missing rate limiting on sensitive endpoints [MEDIUM]
- Problem: Operational and user‑triggered endpoints (e.g., join‑class via token validation, debug actions) lack rate limiting. Automated abuse or misconfigured clients can create hot paths and overload the database/cache.
- Why it matters: Basic rate limiting protects infrastructure, reduces incident scope, and provides a backstop for unexpected traffic spikes without relying solely on external WAF/CDN controls.
