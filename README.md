# EduTeams

A comprehensive educational platform built with Next.js and TypeScript, featuring user onboarding, role-based access control, and personality assessment.

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Runtime:** Bun (package management, testing, development)
- **Styling:** Tailwind CSS with Shadcn/ui components
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** better-auth with session management
- **Testing:** Bun test with comprehensive coverage
- **Client State:** SWR for data fetching and caching

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
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── onboarding/        # Onboarding flow
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── onboarding/       # Onboarding components
│   │   └── ui/               # UI components (Shadcn/ui)
│   └── lib/                   # Utilities and configurations
│       ├── api-utils.ts      # API utilities and auth wrappers
│       ├── auth.ts           # Authentication configuration
│       ├── authorization.ts  # Authorization logic
│       ├── prisma.ts         # Database client
│       └── utils.ts          # General utilities
├── __tests__/                 # Test files
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── bunfig.toml               # Bun configuration
└── docker-compose.yml        # Database development setup
```

## Features

### User Authentication

- Secure session-based authentication with better-auth
- Role-based access control (Student, Lecturer, Admin)
- Protected routes with middleware

### Onboarding Flow

- Multi-step onboarding process
- Role-specific data collection
- Progress tracking and resume functionality
- Personality assessment for students

### Dashboard

- Role-based dashboard views
- User profile management
- Progress tracking

## Testing

The project uses Bun's built-in test runner with comprehensive coverage:

- **Unit Tests:** Component and utility testing
- **Integration Tests:** API route testing
- **End-to-End Tests:** Complete user flow testing
- **Coverage:** 77%+ line coverage with detailed reporting

Run tests with:

```bash
bun test
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

- Next.js App Router with Server Components
- Optimized data fetching with SWR
- Efficient caching strategies
- Image optimization

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eduteams"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"
```

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
