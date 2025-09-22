# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Development server:** `bun dev` (uses Turbopack for fast builds)
- **Build for production:** `bun run build` (includes Prisma generation)
- **Production server:** `bun start`
- **Linting:** `bun run lint`
- **Type checking:** `bun run type-check`
- **Code formatting:** `bun run format`

### Testing
- **Run all tests:** `bun run test`
- **Watch mode:** `AGENT=1 bun test --watch`
- **Single test:** `bun test path/to/test.ts`
- **Update snapshots:** `AGENT=1 bun test --update-snapshots`
- **Bail on failure:** `AGENT=1 bun test --bail`

### Database Management
- **Generate Prisma client:** `bun prisma generate` (auto-run before build)
- **Run migrations:** `bun prisma migrate dev`
- **Reset database:** `bun run db:reset` (includes seeding)
- **Seed database:** `bun run db:seed`
- **Prisma Studio:** `bun prisma studio`

## Architecture Overview

### Technology Stack
- **Framework:** Next.js 15 with App Router and Server Components
- **Runtime:** Bun for package management, testing, and development
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** better-auth with session management
- **Styling:** Tailwind CSS with Shadcn/ui components
- **State Management:** SWR for data fetching, server-first approach
- **Testing:** Bun test runner with @testing-library/react

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (50+ files, heavily dashboard-focused)
- `src/lib/` - Core utilities, configurations, and business logic
- `__tests__/` - Test files mirroring src structure
- `prisma/` - Database schema, migrations, and seeding

### Critical Files
- `src/lib/auth.ts` - better-auth configuration with Google OAuth
- `src/lib/api-utils.ts` - API wrappers, error handling, auth context
- `src/lib/prisma.ts` - Database client with connection pooling
- `src/lib/authorization.ts` - Role-based access control logic
- `src/lib/stats/` - Team formation algorithms and analytics
- `prisma/schema.prisma` - Database schema with User, Course, Assignment models

### Code Organization Patterns

#### API Routes Structure
```
src/app/api/
├── auth/[...all]/ - Authentication endpoints
├── courses/[id]/ - Course management with nested resources
├── dashboard/ - Analytics and statistics
├── student/ - Student-specific endpoints
└── user/ - User management
```

#### Component Architecture
- Server Components by default (performance-first)
- Client Components marked with `"use client"` only when needed
- Dashboard components heavily used (53+ files in `components/dashboard/`)
- Shared UI components in `components/ui/` (Shadcn/ui based)

#### Database Models
Key entities: User, Course, Assignment, Team, PersonPreference, TaskPreference
- Role-based system: Student, Lecturer, Admin
- MBTI personality types with detailed assessment
- Team formation algorithms with preference matching
- Assignment system with topic preferences and team formation

### Development Patterns

#### Authentication & Authorization
- Session-based auth with role checking in API routes
- Protected routes use `requireAuth()` and `requireRole()` wrappers
- User roles: Student, Lecturer, Admin with hierarchical permissions

#### Data Fetching
- Server Components for initial data loading
- SWR for client-side caching and revalidation
- Prisma with `select`/`include` for optimized queries
- Optional Redis caching for performance (graceful fallback)

#### Error Handling
- Custom HttpError classes (AuthError, ValidationError, etc.)
- Centralized error handling in `handleApiError()`
- Zod validation schemas in `src/lib/validation/`

#### Testing Strategy
- Comprehensive test coverage (77%+) across API, components, and utilities
- Test environment automatically detected with `AGENT=1` for cleaner output
- Mock setup in `test-preload.ts` for database and authentication
- Performance tests for critical operations

### Code Style Requirements

#### TypeScript & Formatting
- Strict TypeScript with ESNext target
- Biome formatter: 2 spaces, single quotes, semicolons, trailing commas
- Import aliases: `@/` for `src/`, organize imports automatically
- Naming: camelCase variables/functions, PascalCase components/types

#### React Patterns
- Prefer Server Components, minimize Client Component usage
- Avoid `useEffect` except for external systems, derive data instead
- Skip `useState` for non-reactive data, use variables or `useRef`
- Wrap expensive components in `<Suspense>`

#### Performance Considerations
- Use Prisma `select`/`include` to avoid over-fetching
- Cache with Redis/Next.js cache tags when appropriate
- Only mark `"use client"` when interactivity is required
- Database queries optimized with proper indexing

### Important Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret key
- `REDIS_URL` / `UPSTASH_REDIS_*` - Optional Redis for caching and rate limiting
- `AGENT=1` - Enable AI-friendly test output (quieter, failure-focused)

### Business Logic
This is an educational platform with sophisticated team formation algorithms that consider:
- MBTI personality compatibility
- Skills distribution and gap analysis
- Student topic and peer preferences
- Team size optimization with quality metrics
- Course and assignment management with role-based access

The platform serves Students, Lecturers, and Admins with distinct workflows for onboarding, course enrollment, assignment creation, and team formation analytics.
