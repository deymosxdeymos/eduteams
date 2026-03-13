import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { isSameOrigin } from "@/lib/csrf";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalDevAllowedOrigins = process.env.DEV_ALLOWED_ORIGINS;
const originalNodeEnv = process.env.NODE_ENV;
const originalVercelUrl = process.env.VERCEL_URL;

function createRequest(headers?: HeadersInit) {
  return {
    headers: new Headers(headers),
  } as any;
}

describe("isSameOrigin", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NODE_ENV = "test";
    delete process.env.DEV_ALLOWED_ORIGINS;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    if (originalDevAllowedOrigins === undefined) {
      delete process.env.DEV_ALLOWED_ORIGINS;
    } else {
      process.env.DEV_ALLOWED_ORIGINS = originalDevAllowedOrigins;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
      return;
    }

    process.env.VERCEL_URL = originalVercelUrl;
  });

  it("accepts requests with a matching origin header", () => {
    expect(isSameOrigin(createRequest({ origin: "http://localhost:3000" }))).toBe(true);
  });

  it("accepts requests with a matching referer header", () => {
    expect(
      isSameOrigin(createRequest({ referer: "http://localhost:3000/dashboard/classes" })),
    ).toBe(true);
  });

  it("rejects attacker-controlled host headers that try to smuggle a foreign origin into the allowlist", () => {
    expect(
      isSameOrigin(
        createRequest({
          origin: "https://preview.example.com",
          host: "preview.example.com",
          "x-forwarded-host": "preview.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(false);
  });

  it("accepts Vercel preview origins even when NEXT_PUBLIC_APP_URL points elsewhere", () => {
    process.env.VERCEL_URL = "feature-branch.vercel.app";

    expect(isSameOrigin(createRequest({ origin: "https://feature-branch.vercel.app" }))).toBe(true);
  });

  it("accepts configured dev origins outside production", () => {
    process.env.DEV_ALLOWED_ORIGINS = "http://100.119.116.81:3000";

    expect(isSameOrigin(createRequest({ origin: "http://100.119.116.81:3000" }))).toBe(true);
  });

  it("rejects configured dev origins in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_ALLOWED_ORIGINS = "http://100.119.116.81:3000";

    expect(isSameOrigin(createRequest({ origin: "http://100.119.116.81:3000" }))).toBe(false);
  });

  it("rejects requests when both origin and referer are missing", () => {
    expect(isSameOrigin(createRequest())).toBe(false);
  });

  it("rejects requests with a mismatched origin", () => {
    expect(isSameOrigin(createRequest({ origin: "https://attacker.example" }))).toBe(false);
  });

  it("rejects requests when origin is cross-site even if referer matches", () => {
    expect(
      isSameOrigin(
        createRequest({
          origin: "https://attacker.example",
          referer: "http://localhost:3000/dashboard",
        }),
      ),
    ).toBe(false);
  });
});
