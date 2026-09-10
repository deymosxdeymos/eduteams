# EduTeams v2

Fresh Next.js application for the EduTeams rebuild.

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

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Run `pnpm format` to format the repository.
