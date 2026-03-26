# EduTeams

EduTeams is a Next.js application for personality-based team formation, class management, and assignment workflows.

## Stack

- Next.js 15
- TypeScript
- Bun
- PostgreSQL + Prisma
- Tailwind CSS + shadcn/ui
- better-auth
- next-intl

## Quick Start

Prerequisites:

- Bun
- Node.js 22+
- PostgreSQL

```bash
bun install
cp .env.example .env.local
```

Set at least these variables in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eduteams"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Then run:

```bash
bun prisma migrate dev
bun dev
```

Open `http://localhost:3000`.

## Common Commands

```bash
bun dev
bun run build
bun start

bun test
bun run lint
bun run format
bun run tsgo

bun prisma migrate dev
bun prisma studio
bun run db:seed
```

## Notes

- `tsgo` is the default type checker.
- Oxlint handles linting and Oxfmt handles formatting.
- The CSS module declaration in `types/css.d.ts` is intentionally kept for Next CSS imports.

## Deployment

Required production variables:

```env
DATABASE_URL=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""
NEXT_PUBLIC_APP_URL=""
CRON_SECRET=""
```

Optional:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
TEAM_FORMATION_PROVIDER="local|edu2com"
EDU2COM_WEBHOOK_SECRET=""
EDU2COM_WEBHOOK_BASE_URL=""
```

For containerized deployment:

```bash
docker build -t eduteams .
docker run -p 3000:3000 eduteams
```

## Contributing

Before opening a PR, run:

```bash
bun test
bun run lint
bun run tsgo
```

## License

MIT

Personality assessment items are adapted from Open Extended Jungian Type Scales 1.2 (CC BY-NC-SA 4.0):
https://openpsychometrics.org/tests/OJTS/development/OEJTS1.2.pdf
