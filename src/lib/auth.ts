import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Keep nextCookies as the last plugin per Better Auth docs
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
      },
      nimNpm: {
        type: 'string',
        input: false,
      },
      isOnboarded: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },
});
