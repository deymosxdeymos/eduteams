<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EduTeams repository rules

- The repository root contains the only deployable application and maps to the only Vercel project.
- Add a package under `packages/*` only when a real caller needs a non-deployable capability package.
- Give every future package under `packages/*` a unique `@eduteams/<capability>` name. Declare cross-package dependencies explicitly with `workspace:*`.
- Use Vercel's auto-detected Next.js defaults. Do not add deployment configuration without a concrete need.
- Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
- Verify browser behavior with `browser-control`. Never use `agent-browser` or `next-dev-loop`.
