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

## Commands

```bash
# Development
bun dev                              # Start dev server
bun run build && bun start          # Build & run production

# Testing
bun test                            # Run all tests
bun test --watch                    # Watch mode
bun test --coverage                 # With coverage report
bun test --test-name-pattern "xyz"  # Run specific tests

# Code Quality
bun run lint                        # Lint with ESLint
bun run format                      # Apply ESLint autofixes
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

ESLint with `eslint-config-next` is the single lint tool for this repo.
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

# Cron jobs (required for production)
CRON_SECRET="your-cron-secret"
```

## Contributing

1. Fork the repository
2. Create a feature branch or change with `jj`
3. Test, type-check, and lint: `bun test` && `bun run tsgo` && `bun run lint`
4. Commit with `jj`
5. Push & open a PR

## Deployment

**Vercel (Recommended):** Connect GitHub, configure env vars, auto-deploy on push

**Docker:**
```bash
docker build -t eduteams . && docker run -p 3000:3000 eduteams
```

## License & Attribution

- MIT License
- Personality assessment items adapted from [Open Extended Jungian Type Scales 1.2](https://openpsychometrics.org/tests/OJTS/development/OEJTS1.2.pdf) (CC BY-NC-SA 4.0)

## Support

Issues? Open a GitHub issue or contact the development team.
