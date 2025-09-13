# EduTeams

A comprehensive educational platform built with Next.js and TypeScript, featuring user onboarding, role-based access control, personality assessment, team formation algorithms, course management, and advanced analytics.

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Runtime:** Bun (package management, testing, development)
- **Styling:** Tailwind CSS with Shadcn/ui components
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** better-auth with session management
- **Testing:** Bun test with comprehensive coverage
- **Client State:** SWR for data fetching and caching
- **Caching:** Upstash Redis (optional) for persistent caching and rate limiting
- **Charts:** Recharts for data visualization
- **Animations:** Framer Motion for smooth UI transitions
- **Forms:** React Hook Form with Zod validation
- **UI Components:** Radix UI primitives with Tailwind CSS

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [PostgreSQL](https://www.postgresql.org/) database
- [Node.js](https://nodejs.org/) 18+ (for compatibility)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Database Setup

1. Create a PostgreSQL database
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Configure your database URL in `.env.local`
4. Run database migrations:
   ```bash
   bun prisma migrate dev
   ```

### 3. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

### Core Commands

```bash
# Start development server with Turbopack
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint

# Run type checking
bun run type-check
```

### Testing Commands

```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch

# Run tests for CI (with coverage and bail on first failure)
bun test:ci

# Update test snapshots
bun test:update-snapshots

# Run tests with bail on first failure
bun test:bail

### Snapshots

```bash
# Run tests and update any mismatched snapshots
bun test --update-snapshots

# Commit updated snapshots after review
git add -A && git commit -m "test: update snapshots"
```

### Filtering Tests

```bash
# Run tests in files whose path contains the substring
bun test lib  # or any path substring

# Run a specific test file
bun test ./src/lib/stats/__tests__/assignment.test.ts

# Run tests whose names match a pattern
bun test --test-name-pattern "aggregates MBTI"
```
```

### Database Commands

```bash
# Generate Prisma client
bun prisma generate

# Run database migrations
bun prisma migrate dev

# Reset database
bun prisma migrate reset

# Open Prisma Studio
bun prisma studio

# Seed database
bun run db:seed

# Reset and seed database
bun run db:reset
```

### Code Quality Commands

```bash
# Format code with Biome
bun run format

# Check code formatting
bun run format:check

# Run type checking
bun run type-check
```

### Asset Commands

```bash
# Normalize MBTI SVG assets
bun run assets:normalize-mbti
```

### Database Commands

```bash
# Generate Prisma client
bun prisma generate

# Run database migrations
bun prisma migrate dev

# Reset database
bun prisma migrate reset

# Open Prisma Studio
bun prisma studio
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── assignments/   # Assignment management APIs
│   │   │   ├── auth/          # Authentication APIs
│   │   │   ├── courses/       # Course management APIs
│   │   │   ├── dashboard/     # Dashboard statistics APIs
│   │   │   ├── student/       # Student-specific APIs
│   │   │   └── user/          # User management APIs
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── join-class/        # Class enrollment pages
│   │   ├── onboarding/        # Onboarding flow
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components (53+ files)
│   │   │   ├── chart/        # Chart components
│   │   │   ├── charts/       # Additional chart components
│   │   │   └── [various]     # Assignment, class, profile components
│   │   ├── onboarding/       # Onboarding components
│   │   └── ui/               # UI components (Shadcn/ui)
│   └── lib/                   # Utilities and configurations
│       ├── actions/          # Server actions
│       ├── api-utils.ts      # API utilities and auth wrappers
│       ├── auth.ts           # Authentication configuration
│       ├── authorization.ts  # Authorization logic
│       ├── data/             # Data processing utilities
│       ├── hooks/            # Custom React hooks
│       ├── prisma.ts         # Database client
│       ├── stats/            # Statistics utilities
│       ├── utils.ts          # General utilities
│       └── validation/       # Zod validation schemas
├── __tests__/                 # Test files
│   ├── api/                  # API route tests
│   ├── components/           # Component tests
│   ├── database/             # Database tests
│   ├── integration/          # Integration tests
│   ├── lib/                  # Utility tests
│   ├── onboarding/           # Onboarding tests
│   └── performance/          # Performance tests
├── prisma/                    # Database schema and migrations
│   ├── migrations/           # Database migrations
│   ├── schema.prisma         # Prisma schema
│   └── seed.ts               # Database seeding
├── public/                    # Static assets
│   ├── emoji/                # Emoji assets
│   ├── icons/                # Icon assets
│   ├── mbti-assets/          # MBTI-related assets
│   └── quiz/                 # Quiz-related assets
├── scripts/                   # Utility scripts
│   ├── normalize-mbti-svgs.ts # SVG normalization script
│   └── test-resvg.ts         # Test script for resvg
├── bunfig.toml               # Bun configuration
├── docker-compose.yml        # Database development setup
└── performance/              # Performance monitoring
    ├── utils/                # Performance utilities
    └── [various test files]  # Performance tests
```

## Features

### User Authentication & Authorization

- Secure session-based authentication with better-auth
- Role-based access control (Student, Lecturer, Admin)
- Protected routes with middleware
- Dosen token system for lecturer access

### Onboarding & Personality Assessment

- Multi-step onboarding process with progress tracking
- Role-specific data collection and validation
- Resume functionality for incomplete onboarding
- Comprehensive MBTI personality assessment (16 types)
- Skills assessment and competency evaluation
- Welcome splash screen for new users

### Course Management

- Course creation and management for lecturers
- Student enrollment with share tokens
- Class overview and student lists
- Assignment creation and management
- Course statistics and analytics

### Team Formation System

- Advanced team formation algorithms
- Skill-based team optimization
- Personality compatibility matching
- Preference-based team assignments
- Team quality metrics and analytics
- Assignment-specific topic preferences

### Assignment System

- Topic preference quizzes for students
- Automated team formation based on preferences
- Assignment status tracking (Not Started, In Progress, Teams Formed)
- Student submission management
- Lecturer assignment oversight

### Analytics & Reporting

- Comprehensive dashboard with statistics
- MBTI distribution charts
- Skills assessment visualizations
- Gender distribution analytics
- Topic preference analysis
- Performance metrics and monitoring

### Advanced Features

- Real-time data caching with Redis
- Rate limiting for API protection
- Performance monitoring and testing
- Comprehensive test coverage (77%+)
- Responsive design with Tailwind CSS
- Accessibility-focused UI components

## Testing

The project uses Bun's built-in test runner with comprehensive test coverage across multiple layers:

### Test Structure

- **Unit Tests:** Component, utility, and library function testing
- **Integration Tests:** API route testing and database interactions
- **End-to-End Tests:** Complete user flow testing
- **Performance Tests:** Database performance and memory monitoring
- **Database Tests:** Schema validation and constraint testing
- **API Tests:** Route testing with authentication and authorization

### Test Coverage

- **Coverage:** 77%+ line coverage with detailed reporting
- **Test Files:** 20+ test files across different categories
- **Mock Setup:** Comprehensive mocking with `@testing-library` and `happy-dom`
- **Snapshot Testing:** UI component snapshot validation

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage report
bun test:coverage

# Run in watch mode during development
bun test:watch

# Run performance tests
bun test performance/

# Update snapshots after UI changes
bun test:update-snapshots
```

## Code Quality

### Type Safety

- Strict TypeScript configuration
- Comprehensive type definitions
- Prisma-generated types

### Linting & Formatting

- ESLint with Next.js configuration
- Prettier for code formatting
- Pre-commit hooks for quality assurance

### Performance

- **Next.js App Router** with Server Components for optimal performance
- **Optimized data fetching** with SWR and optional Redis caching
- **Database performance monitoring** with dedicated test suite
- **Memory monitoring** and leak detection
- **Prisma query optimization** with select/include for minimal data fetching
- **Rate limiting** with Upstash Redis (falls back gracefully when unavailable)
- **Multi-layer caching** (Redis + Memory) with automatic fallback
- **Image optimization** with Next.js Image component
- **Bundle analysis** and code splitting
- **Performance benchmarks** for critical operations

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eduteams"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Redis (Optional - enhances performance and enables distributed rate limiting)
# For local development, you can skip these
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# Optional: For production deployment
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Advanced Features

### Team Formation Algorithms

The platform implements sophisticated team formation algorithms that consider:

- **Personality Compatibility:** MBTI-based team balancing
- **Skills Matching:** Optimal skill distribution across teams
- **Preference Optimization:** Student topic preferences and peer preferences
- **Team Size Optimization:** Configurable team sizes with quality metrics
- **Quality Scoring:** Mathematical models for team effectiveness

### Caching Strategy

The platform uses a multi-layer caching system designed for serverless environments:

- **Memory Cache:** Fast in-memory caching for immediate responses
- **Redis Cache (Optional):** Persistent caching across deployments and serverless function invocations
- **Database Fallback:** Graceful degradation when caching layers are unavailable
- **Automatic Cache Warming:** Pre-loads frequently accessed data
- **Cache Invalidation:** Smart cache clearing when data changes

**Benefits of Upstash Redis:**
- **Distributed Rate Limiting:** Works across multiple serverless instances
- **Persistent Caching:** Survives deployments and server restarts
- **Production Reliability:** Essential for high-traffic production deployments

**Without Redis:** The application works perfectly with memory-only caching, suitable for development and low-traffic scenarios.

### Data Models

- **16 MBTI Personality Types** with detailed descriptions
- **Skills Assessment System** with competency levels
- **Preference Networks** for peer and topic preferences
- **Course Management** with enrollment and assignment tracking
- **Assignment System** with automated team formation

### Analytics Dashboard

- **Real-time Statistics** with interactive charts
- **MBTI Distribution** visualization
- **Skills Gap Analysis** for teams and individuals
- **Performance Metrics** tracking
- **Gender Diversity** monitoring

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test`
5. Run linting: `bun run lint`
6. Run type checking: `bun run type-check`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Docker

```bash
# Build the image
docker build -t eduteams .

# Run the container
docker run -p 3000:3000 eduteams
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
