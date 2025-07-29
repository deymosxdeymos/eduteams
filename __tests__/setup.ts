import { afterEach, beforeEach, mock } from 'bun:test';

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: mock(),
    update: mock(),
    create: mock(),
    delete: mock(),
    findMany: mock(),
  },
};

// Mock Next.js server components
const mockNextServer = {
  headers: mock(() => ({
    get: mock(),
  })),
  cookies: mock(() => ({
    get: mock(),
    set: mock(),
    delete: mock(),
  })),
};

// Mock NextResponse for API routes
const mockNextResponse = {
  json: mock((data: any, options?: any) => ({
    json: async () => data,
    status: options?.status || 200,
    headers: new Headers(),
  })),
};

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  Object.values(mockPrisma.user).forEach(mockFn => mockFn.mockReset());

  mockNextServer.headers.mockReset();
  mockNextServer.cookies.mockReset();

  mockNextResponse.json.mockReset();
});

afterEach(() => {
  // Restore all mocks after each test
  Object.values(mockPrisma.user).forEach(mockFn => mockFn.mockRestore?.());

  mockNextServer.headers.mockRestore?.();
  mockNextServer.cookies.mockRestore?.();

  mockNextResponse.json.mockRestore?.();
});

// Export mocks for use in tests
export { mockPrisma, mockNextServer, mockNextResponse };
