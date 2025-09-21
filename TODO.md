# Testing TODO (Bun Test)

A living roadmap for our Bun test suite. It balances speed, stability, and DX while aligning with our server‑first React rules. Reference docs under `docs/bun-test/*` for details.

Guiding principles
- Prefer fast, deterministic unit tests; then API handler tests; then light client tests.
- Keep client components “dumb”; rely on i18n mocks and structural queries, not brittle text.
- Mock boundaries (auth/prisma/cache) once per test and narrow scope; avoid global state.
- Fail loudly in CI; be forgiving and ergonomic locally.

## 0) Baseline & Conventions
- [x] Use Bun test runner (`bun test`), not Jest/Vitest
- [x] Organize tests as `src/**/__tests__/*.test.ts(x)` or co‑located `*.test.ts(x)`
- [x] Prefer `describe`, `test/it`, `expect` from `bun:test`
- [ ] Use `test.only/skip/todo`, `test.if/skipIf/todoIf` to focus scopes and document backlog (docs: writing.md)
- Why: speeds iteration and communicates intent; CI will still fail on skipped tests if required.
- How: add `.todo` to outline future edge cases; use `.skipIf(process.env.CI)` sparingly.

## 1) Configuration (bunfig.toml) — docs: configuration.md
- [x] Ensure `[test]` section present and reviewed
- [x] Set `coverage = true`, `coverageDirectory = "coverage"`
- [x] Set `coverageReporter = ["text", "lcov"]`
- [x] Set `coverageSkipTestFiles = true`
- [x] Add `coveragePathIgnorePatterns` for config/build/artifacts
- [ ] Consider `smol = true` for lower memory in CI
- [x] Add `timeout` default (e.g., 10_000ms)
- [x] Configure JUnit: `[test.reporter].junit = "coverage/junit.xml"` (docs: reporters.md)
- [ ] Consider `root = "src"` if we want discovery strictly under `src` (docs: discovery.md)
- [x] Enable `coverageThreshold` (initial: lines=0.8, functions=0.75, statements=0.8)
- [ ] Ratchet coverage thresholds gradually (+0.02–0.05 per milestone)
- Rationale: thresholds keep drift in check; ratcheting prevents blocking momentum.
- Action: record current coverage in CI summary; raise after M3 completes component coverage.

## 2) Preload & Lifecycle — docs: lifecycle.md, runtime-behavior.md
- [x] Preload DOM globals: `__tests__/dom-setup.ts` with `@happy-dom/global-registrator`
- [x] Preload test setup: `__tests__/setup.ts` importing `@testing-library/jest-dom` and `cleanup`
- [x] Add global hooks (afterEach cleanup). Server stubs optional
- [x] Validate NODE_ENV is `"test"` and TZ is stable (UTC) during runs
- Next: extend setup to host shared helpers (render/mocks) without global side effects.

## 3) DOM & Component Testing — docs: dom.md
- [x] Use Happy DOM for headless DOM APIs
- [ ] Add `/// <reference lib="dom" />` if DOM type errors appear (as needed)
- [ ] Create `__tests__/utils/render.tsx` (optional, shared wrapper for i18n/SWR)
- [x] Standardize async queries (`findBy*`) to avoid act() warnings
- [ ] (Optional) Centralize i18n dictionary mock in global setup to avoid flake
- Why: i18n dynamic imports introduce timing variance; a stable mock keeps tests deterministic.
- How: default mock returns Indonesian `messages`; allow opt‑out per test with `mock.reset()`.

## 4) Mocks — docs: mocks.md
- [x] Prefer `mock.module()` to stub ESM/CJS modules (auth, prisma)
- [x] Use `mock()` / `jest.fn()` for function spies/mocks
- [ ] Provide `__tests__/utils/mocks.ts` helpers (optional; prisma tx shims)
- [x] Reset mocks between tests (Bun default behavior)
- Proposed helpers (targeted, small):
- `mockAuth(userLike)`: sets `auth.api.getSession` return value.
- `mockPrisma(overrides)`: returns minimal prisma surface used by test.
- `txOf(partials)`: creates a `$transaction` context exposing only required models.

## 5) API Handler Tests (no server)
Pattern: import `GET/POST/...` from `src/app/**/route.ts` and call with `new Request(url, { method, body })`.
- [x] Dashboard: `dashboard/statistics` GET (happy/deny)
- [x] Auth: `user/role` POST (happy/validation)
- [x] Auth: `user/onboarding-progress` POST (happy/unauth)
- [x] Auth: `user/complete-onboarding` POST
- [x] Courses: `courses` GET/POST; `courses/[id]` GET
- [x] Assignments: `courses/[id]/assignments` GET/POST
- [x] Submissions: `courses/[id]/assignments/[assignmentId]/submit` POST (arrays payload, duplicates, not enrolled, missing assignment)
- [x] Stats: `assignments/[id]/stats` GET (zeroIfNoTeams behavior)
- [x] Team ops: `assignments/[id]/form-teams` POST (minimum students, happy path persisted); `assignments/[id]/reset-teams` POST
- [x] Student: `student/classes` GET; `student/join-class` POST; `student/leave-class` POST
- [x] Tokens: `courses/[id]/share-token` GET/POST (env base URL + rate-limit stubbed)
- [x] User data: `user/data-diri` GET/POST; `user/welcome-splash` POST
- [x] Assignment update: `assignments/[id]` PATCH (owner only)
- [x] Submissions: `assignments/[id]/submissions` POST/DELETE (enrolled mahasiswa)
- [x] Course students: `courses/[id]/students` GET (dosen own course)
- [x] Course student removal: `courses/[id]/students/[studentId]` DELETE
- [x] Bulk submission deletion: `courses/[id]/assignments/submissions` DELETE (by course or assignmentId)
- [x] Admin utils: `debug/clear-cache` POST (tag required)
- [x] Onboarding: `user/onboarding-status` GET (redirectUrl)
- [x] Personality: `user/personality` POST (partial vs full answers -> MBTI presence)
- [x] Error handling: verify `handleApiError`/`createApiResponse` codes & bodies (covered by `src/lib/__tests__/api-utils.test.ts` and route tests)

Notes for handler tests:
- NextRequest typing: direct `new Request(...)` can be passed as `as any` to satisfy handlers (Bun-compatible). For dynamic routes using `withAuth<{id: string}>`, pass context as `{ params: Promise.resolve({ id }) } as any`.
- Prisma transaction mocking: implement `$transaction` to call a callback with a minimal `tx` object exposing only used model methods (e.g., `personSkill.upsert`, `assignmentTopicPreference.upsert`, `assignmentSubmission.upsert`).
- Assignments API: `POST /courses/[id]/assignments` returns 201; `submittedByMe` only present for mahasiswa in `GET` list when `submissions` are selected.
- CSRF & cache module mocking: mock `@/lib/csrf` → `isSameOrigin: () => true` and `next/cache` → `revalidateTag: () => {}` when testing browser-initiated POSTs.
- Env-dependent share links: set `process.env.NEXT_PUBLIC_APP_URL` in tests before importing the route.
- withAuth tests: if a prior test overrides session to unauthenticated, re-mock `@/lib/auth` to restore a valid session for subsequent tests (module cache persists across imports).
- Error strategy: prefer `handleApiError(new HttpError(status, message, code))` and assert status + body shape.
- Data minimization: use `select`/`include` in tests to mirror production and limit fixture size.

## 6) Library Unit Tests
- [x] `lib/personality.ts`: input validation, reversed items, averages, `getMBTIType`
- [ ] `lib/personality.ts`: cache behavior, `calculate...FromQuestions`
- [x] `lib/validation/*.ts`: zod schema success/failure paths (personality, course)
- [x] `lib/stats/assignment.ts`: MBTI/gender aggregation, skills, topic prefs (prisma mocked)
- [x] `lib/utils.ts (cn)`: class merging & overrides
- [x] `lib/rate-limit.ts`: disabled path (no env), `tooManyRequests()` headers
- [x] `lib/api-utils.ts`: `withAuth` happy/unauth, `withValidation` ok/error, `createApiResponse`
- Next: add micro-benchmarks for hot paths only if regressions appear (optional).

## 7) Component Tests (client)
- [x] `dashboard/statistics-cards` stabilized (async rendering)
- [x] `dashboard/mbti-display` renders labels/values correctly
- [x] `dashboard/class-card` basic props
- [x] `dashboard/join-class-modal` submit happy/error paths (mock fetch)
- [x] `dashboard/nav` active state
- [x] Empty states render for dashboard components
- [ ] UI primitives (`ui/table`, `ui/tabs`) minimal interaction checks
- Guidance:
- Prefer role/label queries; avoid `data-testid` except where semantics are insufficient.
- Mock `next/image` to `img` and `next/navigation` hooks (already in setup) to keep DOM simple.
- Keep client tests lean; heavy logic belongs server-side with unit coverage.

## 8) Snapshots — docs: snapshots.md
- [ ] Prefer inline snapshots (`toMatchInlineSnapshot`) for simple values; avoid file churn
- [x] Document `bun test --update-snapshots` workflow
- [ ] Re-evaluate file-based snapshots once UI stabilizes; pin only highly stable markup
- Rationale: inline snapshots are visible in PRs and reduce maintenance overhead.

## 9) Discovery & Filters — docs: discovery.md, test.md
- [x] Verify default file patterns work in repo structure
- [x] Document filters: `bun test path-substring`, exact file path `./...`, name filter `--test-name-pattern`
- Optional: set `[test].root = "src"` when non‑src tests become noise.

## 10) Time & Reliability — docs: time.md, test.md
- [ ] Adjust default `--timeout` if needed per suite/test
- [x] Add nightly CI job with `--rerun-each` for flake detection
- [x] Use `--bail` in CI (`test:ci` script)
- Done: added `test:flake` script (`bun test --rerun-each 50 --bail=1`) and a nightly GHA schedule (02:00 UTC) with job timeout, UTC TZ, concurrency, and artifact uploads.
- If flakes surface, prioritize: async i18n loads, module‑cache mocks, timeouts.

## 11) Coverage — docs: coverage.md, configuration.md
- [x] Confirm console summary and `coverage/lcov.info` artifacts
- [x] Tune `coveragePathIgnorePatterns` (d.ts, config, .next, coverage, __tests__)
- [x] Enable `coverageThreshold` (start: lines=0.8, functions=0.75, statements=0.8) and ratchet up
- [ ] Consider `coverageIgnoreSourcemaps` only if debugging coverage issues
- Ratchet cadence: +0.02 every 2–3 weeks after green runs; rollback only with justification.

## 12) Reporters & CI — docs: reporters.md, test.md
- [x] Configure `[test.reporter].junit = "coverage/junit.xml"`
- [x] GitHub Actions: install bun, `bun install`, run `bun test --coverage --bail`
- [x] Upload `coverage/lcov.info` and `reports/junit.xml` as workflow artifacts
  - Note: JUnit path set to `coverage/junit.xml` to avoid mkdir errors locally
- [x] Add `test:flake` script (e.g., `bun test --rerun-each=50 --bail=1`) and nightly workflow
- Optional: integrate Codecov for coverage trend insights using `coverage/lcov.info`.

## 13) Developer Ergonomics
- [x] `bun test --watch` documented for local dev (README)
- [ ] `bun test --todo` used to surface passing todos
- [x] Add `test:watch`, `test:coverage`, `test:ci`, `test:update-snapshots` scripts (present)
- [ ] Filter only noisy test-only logs in setup (keep prod errors visible) — revisit as suite grows
- Add `__tests__/utils` with small, composable helpers (render/mocks) to reduce duplication.
- Document “How to write tests here” in `docs/test-strategy.md` (brief pyramid + examples).

## 14) Milestones
- [x] M1: Utilities + core lib unit tests (personality, utils, validation)
- [x] M2: Key API handler tests (user, dashboard, courses, assignments)
- [ ] M3: Primary components (modal flows, cards, display) — started (cards, modal, nav, mbti-display)
- [ ] M4: Broaden coverage, enable thresholds, add JUnit in CI
- M3 Goals: finish UI primitives tests; add i18n wrapper; harden error boundaries.
- M4 Goals: add nightly flake job; ratchet coverage; inline snapshots where valuable.

---

References: see `docs/bun-test/` for configuration, discovery, DOM setup, mocks, lifecycle, coverage, reporters, runtime behavior, and writing tests.


## 15) i18n Routing & Language Switcher
- [x] Add locale subpath support with default `id` unprefixed
- [x] Preserve headers (`x-lang`) on rewrites for server locale resolution
- [x] Avoid redirects/cookie writes on non‑HTML or non‑GET requests
- [x] Switcher sets cookie client‑side and navigates, preserving path
- [x] Per‑key fallback: English falls back to Indonesian

How it was solved
- Middleware adds `/en` subpath support while keeping default `id` unprefixed; URL prefix > cookie > `Accept-Language`.
- Rewrites for `/en` preserve headers and set `x-lang: en`, so `getLocale()` resolves correctly server‑side.
- Redirects/cookie writes are limited to HTML document `GET` requests, preventing asset/data requests from overriding the `lang` cookie.
- `LanguageSwitcher` sets `document.cookie=lang` before navigation, then pushes to `/en{path}` or `{path}` and refreshes.
- `get-dictionary` deeply merges `en` over `id`, so missing English keys fall back to Indonesian.

## 16) Lessons learned (things I did wrong)
- Setting `lang` during asset/data requests caused the cookie to flip back unexpectedly; only mutate cookies on HTML document `GET`.
- Redirecting on non‑GET requests interfered with server actions/navigation; limit redirects to document `GET`.
- Not preserving headers on rewrites meant the server couldn’t see the effective locale; inject `x-lang` on rewrites.
- Relying on `Accept-Language` over cookie for unprefixed paths kept users on English; cookie should win after first choice.
- Not writing the cookie client‑side before navigation led to a race; set `document.cookie` before pushing the new path.
- Missing per‑key fallback produced undefined text for incomplete translations; deep‑merge `en` over `id`.
- Revalidating `/en/...` while routes are unprefixed didn’t match; normalize path before `revalidatePath`.
