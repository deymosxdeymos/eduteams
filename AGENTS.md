# AI Agent Guidelines - EduTeams

## Commands

- **Dev:** `bun dev` | **Build:** `bun run build` | **Lint:** `bun run lint` |
  **Type:** `bun run type-check`
- **Test all:** `bun run test` | **Single test:** `bun test path/to/test.ts` |
  **Watch:** `bun test --watch`
- **Coverage:** `bun test --coverage` | **Bail on fail:** `bun test --bail`
- **Version Control:** use `jj` instead of git

## Code Style

- **Formatting:** Biome (2 spaces, single quotes, semicolons, trailing commas)
- **Imports:** Use `@/` alias for src/, organize imports automatically
- **Types:** Strict TypeScript, infer when possible, explicit for complex
  objects
- **Naming:** camelCase vars/functions, PascalCase components/types, kebab-case
  files
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

### AI-Friendly Test Output

When using Bun's test runner with AI coding assistants, you can enable quieter
output to improve readability and reduce context noise. This feature minimizes
test output verbosity while preserving essential failure information.

**Environment Variables** Set any of the following environment variables to
enable AI-friendly output:

- `CLAUDECODE=1` - For Claude Code
- `REPL_ID=1` - For Replit
- `AGENT=1` - Generic AI agent flag

**Behavior** When an AI agent environment is detected:

- Only test failures are displayed in detail
- Passing, skipped, and todo test indicators are hidden
- Summary statistics remain intact

**Example:**

```bash
CLAUDECODE=1 bun test
```

This still shows failures and summary, but hides verbose passing test output.
This feature is particularly useful in AI-assisted development workflows where
reduced output verbosity improves context efficiency while maintaining
visibility into test failures.
