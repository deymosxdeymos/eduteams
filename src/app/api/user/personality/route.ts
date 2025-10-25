import { buildPersonalityHandler } from './handler';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

export const POST = buildPersonalityHandler();
