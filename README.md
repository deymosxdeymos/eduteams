# EduTeams

EduTeams is a Next.js application. The repository root is the only deployable application.

## Workspace

- `src/` contains the root Next.js application.
- `public/` contains its static assets.
- `packages/*` is reserved for future non-deployable capability packages. Add one only when a real caller needs it.
- Give each future package under `packages/*` a unique `@eduteams/<capability>` name. Declare cross-package dependencies with `workspace:*`.

## Toolchain

- Node.js 24.21.0
- pnpm 10.33.0
- Next.js 16.4.0-canary.25
- TypeScript 5
- StyleX 0.19 with Babel and PostCSS extraction
- Motion for the hero animation
- Playwright for browser regression tests
- Oxlint
- Anti-slop Oxlint rules, vendored from `dmmulroy/anti-slop`
- Oxfmt

`.mise.toml` pins Node.js and pnpm. Run `mise install` to install both versions.

Next.js uses Turbopack with `babel.config.json` for the StyleX transform. PostCSS extracts the generated styles into CSS; component styling lives in colocated `*.styles.ts` files.

## Develop locally

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm check
```

`pnpm check` runs linting, the format check, type checking, the production build, and browser regression tests in sequence. Run individual checks with `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, or `pnpm build`. Run `pnpm format` to format the repository.

After a production build, `pnpm test:browser` starts an isolated server on port 3101 and runs Chromium tests. Keep that port free. The tests cover heading containment at phone, tablet, desktop, and breakpoint widths with 16px and 32px root text, page content, image loading, disabled controls, and keyboard navigation. Root-text enlargement is not a substitute for native browser zoom or screen-reader testing.

GitHub Actions runs the same gate for pull requests and pushes to `v2`, and uploads browser failure screenshots and traces. On Linux, install browser system dependencies with `pnpm exec playwright install --with-deps chromium`.

Use `pnpm check` as the local and pre-merge gate.

## Deploy to Vercel

Import the repository as a Next.js project and keep Vercel's auto-detected defaults. Set **Root Directory** to `.`. Vercel runs the default Next.js build command, `next build`; it does not use `pnpm check` as the build command.

Do not add `vercel.json`, a deployment adapter, or custom install and build commands unless the application needs them.

## Agent workflow

- Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code.
- Keep the managed Next.js and Vercel blocks in `AGENTS.md` unchanged.
- Use `browser-control` for browser verification. Do not use `agent-browser` or `next-dev-loop`.
- Run `pnpm check` before merging.
