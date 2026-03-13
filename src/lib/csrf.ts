import type { NextRequest } from "next/server";
import { getAllowedDevOrigins } from "@/lib/dev-origins";

function getFirstHeaderValue(value: string | null | undefined): string {
  return value?.split(",")[0]?.trim() ?? "";
}

function normalizeOrigin(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch {
    return "";
  }
}

function addAllowedOrigin(origins: Set<string>, value: string | null | undefined) {
  const normalizedValue = normalizeOrigin(value);
  if (normalizedValue) {
    origins.add(normalizedValue);
  }
}

function getAllowedOrigins() {
  const allowedOrigins = new Set<string>();

  addAllowedOrigin(allowedOrigins, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  for (const devOrigin of getAllowedDevOrigins()) {
    addAllowedOrigin(allowedOrigins, devOrigin);
  }

  const vercelUrl = getFirstHeaderValue(process.env.VERCEL_URL);
  if (vercelUrl) {
    addAllowedOrigin(
      allowedOrigins,
      vercelUrl.includes("://") ? vercelUrl : `https://${vercelUrl}`,
    );
  }

  return allowedOrigins;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = normalizeOrigin(request.headers.get("origin"));
  const referer = normalizeOrigin(request.headers.get("referer"));

  if (!origin && !referer) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.size === 0) {
    return false;
  }

  if (origin && !allowedOrigins.has(origin)) {
    return false;
  }

  if (referer && !allowedOrigins.has(referer)) {
    return false;
  }

  return true;
}
