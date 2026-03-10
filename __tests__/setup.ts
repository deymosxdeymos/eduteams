// Enable grey-box DB setup via GREY=1
const GREY_ENABLED = process.env.GREY === "1";

declare global {
  // Exposed for test helpers when GREY is enabled
  var __TEST_SCHEMA__: string;
}

if (GREY_ENABLED) {
  const testSchema = "test";
  process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5433/eduteams?schema=${testSchema}`;
  globalThis.__TEST_SCHEMA__ = testSchema;
}

import "@testing-library/jest-dom";
import { afterEach, mock } from "bun:test";
import React from "react";
import { cleanup } from "@testing-library/react";
import messagesEn from "../messages/en.json";

// Automatically cleanup React trees after each test
afterEach(() => {
  cleanup();
});

// Ensure a consistent timezone across environments
process.env.TZ = "Etc/UTC";

// Mock next/image to strip Next-specific props while rendering a basic img
mock.module("next/image", () => ({
  default: ({
    priority: _priority,
    fill: _fill,
    loader: _loader,
    blurDataURL: _blurDataURL,
    placeholder: _placeholder,
    ...props
  }: any) => React.createElement("img", props),
}));

// Allow server-only modules to load in Bun test runtime.
mock.module("server-only", () => ({}));

// Mock next/navigation hooks used in client components
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    refresh: () => {},
    back: () => {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => {
    throw new Error(`Redirecting to ${url}`);
  },
  permanentRedirect: (url: string) => {
    throw new Error(`Permanent redirect to ${url}`);
  },
}));

// Mock server action used by LanguageSwitcher
mock.module("@/app/actions/set-locale", () => ({
  setLocale: async () => {},
}));

// Mock next-intl
mock.module("next-intl", () => {
  // Load actual translation messages for testing
  const messages: Record<string, any> = messagesEn;

  const getNestedValue = (obj: any, path: string): string => {
    const keys = path.split(".");
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        // Return the full key path if not found
        return path;
      }
    }
    return typeof value === "string" ? value : path;
  };

  return {
    useTranslations: (namespace?: string) => {
      return (key: string, params?: Record<string, unknown>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        let value = getNestedValue(messages, fullKey);
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            value = value.replaceAll(`{${k}}`, String(v));
          }
        }
        return value;
      };
    },
    useLocale: () => "en",
    useFormatter: () => ({
      number: (value: number) => value.toString(),
      dateTime: (value: Date) => value.toISOString(),
    }),
  };
});

mock.module("framer-motion", () => {
  const omitKeys = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "layout",
    "layoutId",
  ]);
  const createComponent = (tag: string) => {
    const MotionComponent = ({ children, ...props }: any) => {
      const cleanProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !omitKeys.has(key)),
      );
      return React.createElement(tag, cleanProps, children);
    };
    MotionComponent.displayName = `MockMotion(${tag})`;
    return MotionComponent;
  };

  return {
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) => React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: (_target, key: string | symbol) =>
          createComponent(typeof key === "string" ? key : "div"),
      },
    ),
    animate: () => ({ stop: () => {} }),
    useReducedMotion: () => false,
  };
});

mock.module("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: () => {},
  revalidatePath: () => {},
}));

// Mock next-intl routing
mock.module("@/i18n/routing", () => ({
  routing: {
    locales: ["id", "en"],
    defaultLocale: "id",
    localePrefix: "as-needed",
  },
  Link: (props: any) => React.createElement("a", props),
  redirect: (pathname: string) => {
    throw new Error(`Redirecting to ${pathname}`);
  },
  usePathname: () => "/",
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  getPathname: (pathname: string) => pathname,
}));

// Filter noisy test-only warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const [first] = args;
  if (
    typeof first === "string" &&
    (first.includes("Redis environment variables not set") ||
      first.includes("Failed to load statistics") ||
      first.includes("Warning: An update to") ||
      first.includes("not wrapped in act"))
  ) {
    return;
  }
  // biome-ignore lint/suspicious/noConsole: re-emit warning when not filtered
  return originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  const [first] = args;
  if (typeof first === "string" && first.includes("not wrapped in act")) {
    return;
  }
  // biome-ignore lint/suspicious/noConsole: re-emit error when not filtered
  return originalError(...args);
};

import { beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { createPrismaClient } from "@/lib/create-prisma-client";

if (GREY_ENABLED) {
  beforeAll(async () => {
    const schema = globalThis.__TEST_SCHEMA__;
    const baseUrl = process.env.DATABASE_URL?.split("?")[0];
    const tempPrisma = createPrismaClient({ url: baseUrl });

    try {
      await tempPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await $`bunx prisma db push --skip-generate --accept-data-loss`
        .env({ ...process.env, DATABASE_URL: process.env.DATABASE_URL! })
        .quiet();
      console.log(`✓ Test database schema ready: ${schema}`);
    } finally {
      await tempPrisma.$disconnect();
    }
  });

  afterAll(async () => {
    console.log(`✓ Test schema ready for reuse: ${globalThis.__TEST_SCHEMA__}`);
  });
}
