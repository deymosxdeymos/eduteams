import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { assertAuthConfiguration } from "@/lib/deployment-config";
import prisma from "@/lib/prisma";

type Auth = ReturnType<typeof betterAuth>;

let _auth: Auth | undefined;

function createAuth(): Auth {
  assertAuthConfiguration();

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
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
          type: "string",
          input: false,
        },
        nim: {
          type: "string",
          input: false,
        },
        isOnboarded: {
          type: "boolean",
          defaultValue: false,
          input: false,
        },
      },
    },
  });
}

export function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }

  return _auth;
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
