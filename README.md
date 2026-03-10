# EduTeams

An educational platform for intelligent team formation and personality-based learning, built with Next.js, TypeScript, and PostgreSQL.

## Quick Start

**Prerequisites:** Bun, Node.js 22+, PostgreSQL

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Configure DATABASE_URL and BETTER_AUTH_SECRET

# Run migrations and start
bun prisma migrate dev
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode

```bash
# Enable demo-only mode
DEMO_MODE=1
NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL=1
```

In demo mode, teachers with an empty dashboard can click **Generate demo class**
to create a ready-to-present dataset (students, assignments, and topic
preferences) in one action.

### Public demo safety defaults

- `DEMO_MODE=1` gates demo bootstrap API.
- Demo mode must not configure Google OAuth secrets.
- Demo bootstrap endpoint has IP and per-user rate limits.
- Team formation endpoint has IP and per-teacher rate limits.
- Set `ENFORCE_SAME_ORIGIN_MUTATIONS=1` to reject cross-origin mutation calls.
- For self-hosted deployments behind Nginx, Traefik, or Kubernetes ingress, set `TRUSTED_CLIENT_IP_HEADERS` (for example `x-forwarded-for`) so app-level IP rate limiting can identify clients safely. If a trusted `x-forwarded-for` chain already contains proxy hops on the right, set `TRUSTED_PROXY_HOPS` to the number of trusted hops to skip.
- For production demos, also enable edge-level WAF/rate-limiting (Cloudflare or Vercel WAF).

### Team Formation Modes

`TEAM_FORMATION_PROVIDER` selects how team formation runs:

- `local`: complete inside the app request for local development, demos, and callback-free deployments
- `edu2com`: send background work to Edu2com and finish through the signed webhook callback

Default resolution:

- `DEMO_MODE=1` -> `local`
- `NODE_ENV=development` -> `local`
- all other environments -> `edu2com`

#### Local/dev default

```env
TEAM_FORMATION_PROVIDER="local"
```

#### Demo / Vercel default

```env
DEMO_MODE="1"
TEAM_FORMATION_PROVIDER="local"
```

#### Real Edu2com mode

```env
TEAM_FORMATION_PROVIDER="edu2com"
EDU2COM_WEBHOOK_SECRET="your-webhook-secret"
EDU2COM_WEBHOOK_BASE_URL="https://your-public-domain"
```

Notes:

- Raw `localhost` cannot receive real Edu2com callbacks.
- Use a tunnel only if you intentionally want end-to-end local Edu2com testing.
- `BETTER_AUTH_SECRET` is no longer used as an Edu2com webhook signing fallback.

## Commands

```bash
# Development
bun dev                              # Start dev server
bun run dev:demo                     # Start dev server in demo mode
bun run build && bun start           # Build & run production

# Testing
bun test                            # Run all tests
bun test --watch                    # Watch mode
bun test --coverage                 # With coverage report
bun test --test-name-pattern "xyz"  # Run specific tests

# Code Quality
bun run lint                        # Lint with Oxlint
bun run lint:fix                    # Apply Oxlint safe fixes
bun run format                      # Format with Oxfmt
bun run tsgo                        # Type checking

# Database
bun prisma migrate dev              # Run migrations
bun prisma studio                   # Open Prisma UI
bun run db:seed                     # Seed database
bun run db:reset                    # Reset & re-seed

# Utility
bun run assets:normalize-mbti       # Normalize MBTI SVG assets
bun run i18n:validate               # Validate translations
```

`tsgo` is the default type checker for this repo. The CSS module declaration in [types/css.d.ts](/home/deymos/Documents/eduteams/types/css.d.ts) is intentional and currently needed for Next global CSS imports.

Oxlint is the lint tool for this repo, and Oxfmt handles formatting.
The old Playwright/e2e stack has been removed.

## Stack & Features

**Tech:** Next.js 15 • TypeScript • Bun • PostgreSQL • Prisma • Tailwind CSS • Shadcn/ui • better-auth • Zod

**Features:**

- MBTI personality assessment (16 types) with skills evaluation
- Advanced team formation algorithms (skill-based, personality-compatible, preference-optimized)
- Course management with role-based access (Student, Teacher, Admin)
- Assignment system with automated team formation
- Real-time analytics dashboard with MBTI distribution, skills gap analysis
- Internationalization (English, Indonesian)
- 77%+ test coverage

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eduteams"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Demo mode (optional)
DEMO_MODE="0"
NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL="0"
ENFORCE_SAME_ORIGIN_MUTATIONS="1"
TRUSTED_CLIENT_IP_HEADERS=""
TRUSTED_PROXY_HOPS="0"

# Team formation provider
TEAM_FORMATION_PROVIDER="local|edu2com"
EDU2COM_WEBHOOK_SECRET=""
EDU2COM_WEBHOOK_BASE_URL=""

# Cron jobs (required for production)
CRON_SECRET="your-cron-secret"
```

## Contributing

1. Fork the repository
2. Create a feature branch with `git`
3. Test, type-check, and lint: `bun test` && `bun run tsgo` && `bun run lint`
4. Commit with `git`
5. Push & open a PR

## Deployment

**Vercel (Demo only):** Configure `DEMO_MODE=1`, use a demo-only database, and do not set Google OAuth secrets.

**Self-hosted production:** Set `DEMO_MODE=0`, configure production auth secrets, and point at a separate production database.

**Docker:**

```bash
docker build -t eduteams . && docker run -p 3000:3000 eduteams
```

## License & Attribution

- MIT License
- Personality assessment items adapted from [Open Extended Jungian Type Scales 1.2](https://openpsychometrics.org/tests/OJTS/development/OEJTS1.2.pdf) (CC BY-NC-SA 4.0)

## Support

Issues? Open a GitHub issue or contact the development team.
