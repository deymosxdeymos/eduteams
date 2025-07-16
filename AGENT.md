# AGENT.md - EduTeams Project

## Commands
- **Dev:** `bun dev` **Build:** `bun run build` **Test:** `bun test` **Single test:** `bun test <filename>`
- **Lint:** `bun run lint` **Type check:** `bun run type-check` **Test coverage:** `bun test --coverage`

## Architecture
- **Stack:** Next.js 15 (App Router), TypeScript, Bun runtime, PostgreSQL + Prisma, better-auth, SWR, Tailwind + Shadcn/ui
- **Structure:** `app/` (routes), `src/components/` (UI), `src/lib/` (utilities), `prisma/` (schema), `__tests__/` (tests)
- **APIs:** Routes in `app/api/*/route.ts`, auth wrappers in `lib/api-utils.ts`, errors in `lib/utils/errors.ts`

## Code Style
- **React:** Server Components default, `"use client"` only for interactivity, avoid `useState`/`useEffect`, derive data
- **TypeScript:** Strict types, explicit for complex objects, zod validation for API inputs
- **Imports:** Absolute paths from `src/`, use existing libraries/components, check neighbors for patterns
- **Performance:** Use `select`/`include` in Prisma, `<Suspense>` boundaries, minimize client bundle
- **Testing:** Bun test with happy-dom, mocks in `__tests__/setup.ts`, preloads in `bunfig.toml`
- **Comments:** Only for race conditions, long-term TODOs, or genuinely confusing code

## Critical Rules
- **NO** Prisma in edge runtime, **NO** data fetching in Client Components, **NO** useless comments
- **YES** Cache aggressively, validate all inputs, optimize queries, follow existing patterns
