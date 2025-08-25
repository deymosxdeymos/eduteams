# AI Agent Guidelines - EduTeams

## Commands
- **Dev:** `bun dev` | **Build:** `bun run build` | **Lint:** `bun run lint` | **Type:** `bun run type-check`
- **Test all:** `bun test` | **Single test:** `bun test path/to/test.ts` | **Watch:** `bun test --watch`
- **Coverage:** `bun test --coverage` | **Bail on fail:** `bun test --bail`

## Code Style
- **Formatting:** Biome (2 spaces, single quotes, semicolons, trailing commas)
- **Imports:** Use `@/` alias for src/, organize imports automatically
- **Types:** Strict TypeScript, infer when possible, explicit for complex objects
- **Naming:** camelCase vars/functions, PascalCase components/types, kebab-case files
- **Components:** Server-first, `"use client"` only for interactivity
- **API:** Zod validation, error.tsx boundaries, HttpError classes

## React Rules
- Never fetch in Client Components - use Server Components
- Skip `useState` unless reactive, prefer variables/`useRef`
- Derive data, avoid `useEffect` except for external systems
- Wrap expensive components in `<Suspense>`

## Performance
- Use Prisma `select`/`include` to avoid over-fetching
- Cache with Redis/Next.js cache tags
- Only mark `"use client"` when necessary

## Testing
- Bun test runner with `__tests__/` structure
- Mock setup in `__tests__/setup.ts`
- Use `@testing-library/react` for component tests