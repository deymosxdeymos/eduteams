import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';
import { isDemoModeEnabled } from '@/lib/demo/config';

const PUBLIC_DEMO_BLOCKED_AUTH_PATHS = new Set([
  '/sign-in/email',
  '/sign-up/email',
]);

export function shouldBlockPublicDemoCredentialAuth(
  request: Pick<Request, 'url'>
) {
  if (!isDemoModeEnabled()) {
    return false;
  }

  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith('/api/auth/')) {
    return false;
  }

  const authPath = pathname.slice('/api/auth'.length);
  return PUBLIC_DEMO_BLOCKED_AUTH_PATHS.has(authPath);
}

type Auth = ReturnType<typeof betterAuth>;

let _auth: Auth | undefined;

function createAuth(): Auth {
  return betterAuth({
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
    emailAndPassword: {
      enabled: isDemoModeEnabled(),
    },
    // Keep nextCookies as the last plugin per Better Auth docs
    plugins: [nextCookies()],
    user: {
      additionalFields: {
        role: {
          type: 'string',
          input: false,
        },
        nim: {
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
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    if (!_auth) _auth = createAuth();
    const value = Reflect.get(_auth, prop, receiver);
    return typeof value === 'function' ? value.bind(_auth) : value;
  },
});
