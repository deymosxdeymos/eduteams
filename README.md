# EduTeams

EduTeams is a Next.js application. The repository root is the only deployable application.

## Workspace

- `src/` contains the root Next.js application.
- `public/` contains its static assets.
- `packages/*` is reserved for future non-deployable capability packages. Add one only when a real caller needs it.
- Give each future package under `packages/*` a unique `@eduteams/<capability>` name. Declare cross-package dependencies with `workspace:*`.

## Toolchain

- Node.js 24.21.0
- pnpm 12.3.4
- Next.js 16.4.0-canary.25
- TypeScript 5
- Tailwind CSS 4
- Oxlint
- Oxfmt

`.mise.toml` pins Node.js and pnpm. Run `mise install` to install both versions.

Next.js uses its Rust-based compiler and Turbopack defaults. The repository has no Babel configuration.

## Develop locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm check
```

`pnpm check` runs linting, the format check, type checking, and the production build in sequence. Run individual checks with `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, or `pnpm build`. Run `pnpm format` to format the repository.

Use `pnpm check` as the local and pre-merge gate.

## Deploy to Vercel

Import the repository as a Next.js project and keep Vercel's auto-detected defaults. Set **Root Directory** to `.`. Vercel runs the default Next.js build command, `next build`; it does not use `pnpm check` as the build command.

Do not add `vercel.json`, a deployment adapter, or custom install and build commands unless the application needs them.

## Agent workflow

- Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code.
- Keep the managed Next.js block in `AGENTS.md` unchanged.
- Use `browser-control` for browser verification. Do not use `agent-browser` or `next-dev-loop`.
- Run `pnpm check` before merging.
