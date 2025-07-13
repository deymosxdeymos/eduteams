# AGENT.md - EduTeams Project

This document provides context to AI models assisting with the codebase.

## Technology Stack & Architecture

- **Framework:** Next.js with **App Router**
- **Language:** TypeScript
- **Runtime:** Bun (for package management, testing, and development)
- **Styling:** Tailwind CSS with Shadcn/ui components
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** better-auth with session management
- **Client-Side Data Fetching:** SWR for caching and data fetching
- **API Routes:** Next.js API Routes (`app/api/.../route.ts`)
- **Background Jobs:** QStash for queuing and processing
- **Caching:** Redis (Upstash) for server-side caching
- **Rate Limiting:** Upstash Redis implementation

## Codebase Structure & Conventions

- **App Router:** Standard `app/` directory structure
- **Server Components (SC) & Client Components (CC):**
  - Server Components for data fetching and initial rendering
  - Client Components (`"use client"`) for interactivity only
- **API Routes:** Organized under `app/api/` by resource
- **Libraries:** Located in `lib/` directory
- **Components:** Located in `components/` directory
- **Generated Code:** Prisma client in `src/generated/prisma`

## Development Commands

- **Install dependencies:** `bun install`
- **Development server:** `bun dev`
- **Build:** `bun run build`
- **Test:** `bun test`
- **Type check:** `bun run type-check`
- **Lint:** `bun run lint`

## Coding Standards & Best Practices

### TypeScript

- Use strict typing with inferred types where possible
- Explicit types for complex objects and function signatures

### React & UI Development

- **Treat UIs as a thin layer over your data**
- **Skip local state (`useState`) unless absolutely needed** and clearly separate from business logic
- **Choose variables and `useRef` if it doesn't need to be reactive**
- **Derive data rather than use `useEffect`** - only use `useEffect` when synchronizing with external systems (e.g., document-level events)
- **Treat `setTimeout` as last resort** (and always comment why)

### Performance Focus

- Prioritize perceived performance and instantaneous feel
- Optimize data fetching with minimal selects and parallelization
- Utilize Next.js caching and streaming features
- Code splitting for large/conditional UI
- Efficient client-side rendering and state updates

### Prisma Usage

- Use `select` or `include` to fetch only necessary fields
- Utilize transactions for atomic operations
- Add database indexes for frequently queried fields

### Error Handling

- Custom `HttpError` classes (`lib/utils/errors.ts`)
- Centralized `handleApiError` in `lib/api-utils.ts`
- `error.tsx` files for route segment error UIs

### Authorization

- Wrapper functions in `lib/api-utils.ts` (e.g., `withAuth`, `withRole`)
- Logic centralized in `lib/authorization.ts`

### Caching Strategy

- Server-side API response caching with Redis
- Next.js Data Cache for Server Components
- SWR client-side cache
- `Cache-Control` headers for CDN/browser caching

### Comments Policy

- **IMPORTANT: Do not add useless comments**
- Only add comments when:
  - Clarifying race conditions (`setTimeout` usage)
  - Long-term TODOs
  - Clarifying confusing code that even a senior engineer wouldn't initially understand

### Testing

- **Test runner:** `bun test`
- Unit and integration tests in `__tests__` directories
- Mock with appropriate libraries for Prisma and modules

## CI & Deployment

### GitHub Actions CI

- **CI Platform:** GitHub Actions - Native GitHub integration
- **Configuration:** `.github/workflows/` YAML files
- **Package Manager:** Bun for fastest package management and execution
- **Runtime:** Bun for build, test, and lint operations

### Workflow Structure

```yaml
# Standard workflows in .github/workflows/:
ci.yml              # Main CI pipeline (build, test, lint, type-check)
deploy-preview.yml  # Preview deployments for PRs
deploy-prod.yml     # Production deployment
```

### Development Workflow

- **Local development:** `bun install && bun dev`
- **Local build test:** `bun run build`
- **Local checks:** `bun run lint && bun run type-check && bun test`
- **Package management:** Use `bun` for all operations (install, add, remove, run)

### CI Philosophy

- **Fast and reliable:** Leverage Bun's speed for package management and builds
- **Matrix testing:** Test across multiple Node.js versions if needed
- **Caching:** Cache `bun.lockb` and build artifacts
- **Real verification:** Actual builds, tests, and lints on every PR
- **Branch protection:** Require CI checks to pass before merge

### GitHub Actions Best Practices

- Use latest stable Bun version for consistency
- Cache dependencies with `actions/cache` using `bun.lockb`
- Set `NEXT_TELEMETRY_DISABLED=1` to avoid telemetry in CI
- Use `fail-fast: false` for matrix builds to see all results
- Store build artifacts for debugging failed builds
- Use secrets for environment variables and API keys

### Workflow Examples

**Main CI Workflow:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run type-check  
      - run: bun test
      - run: bun run build
```

### GitHub CLI Integration

- Use `gh` command for managing issues, PRs, and releases
- Create PR templates and issue templates in `.github/`
- Automate releases with GitHub Actions + `gh` CLI
- Manage branch protection rules via `gh api`

### Deployment Options

- **Vercel:** Automatic deployments with GitHub integration
- **Netlify:** Alternative with similar GitHub integration
- **Self-hosted:** Custom deployment via GitHub Actions

## AI Assistant Guidelines

- **Prioritize Performance & Correctness:** Solutions should be efficient and robust
- **Leverage Next.js App Router Best Practices:** Use modern patterns
- **Build for Scale:** Design patterns that work for production workloads
- **Be Specific:** Refer to file paths and component names
- **Provide Actionable Recommendations:** Suggest concrete changes
- **Explain Trade-offs:** Mention pros and cons when relevant
- **Use Bun for all operations:** Package management, testing, and development scripts
- **Note on CI:** Use GitHub Actions for CI/CD, `gh` CLI for GitHub management
- **Bun best practices:** Leverage Bun's speed, use `bun.lockb` for lockfile, prefer `bun run` over npm scripts
